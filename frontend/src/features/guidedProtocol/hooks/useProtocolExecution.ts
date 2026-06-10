import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useGuidedProtocolStore } from '../store';
import { apiExecutor } from '../engine/apiExecutor';
import { localExecutor } from '../engine/localExecutor';
import type { IProtocolExecutor } from '../engine/executor';
import {
  useAdvanceStep,
  useExecutionReminders,
  useGoBack,
  useSubmitAnswer,
} from '../api';
import {
  loadExecutionState,
  saveExecutionState,
} from '@/lib/offline/executionState';
import { enqueue } from '@/lib/offline/executionQueue';
import {
  refreshReminderScheduler,
  requestNotificationPermission,
} from '@/lib/notifications';
import type {
  AnswerValues,
  Execution,
  GateWarning,
  Step,
  StepResponse,
} from '../types';

function isNotFound(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 404;
}

interface UseProtocolExecutionArgs {
  protocolId: number;
  patientName: string;
  patientId?: number | null;
}

/**
 * Orchestrates a guided-protocol execution (mirrors useSedationPanel).
 *
 * Owns: idempotent start-on-mount, the no-double-advance answer/advance split
 * (fix3 #1 — answerable steps call /answer/ exactly once and branch on the
 * returned status; display-only steps call /next/), reminder polling, decision
 * history, and store sync.
 */
export function useProtocolExecution({
  protocolId,
  patientName,
  patientId,
}: UseProtocolExecutionArgs) {
  const setExecutionId = useGuidedProtocolStore((s) => s.setExecutionId);
  const setCurrentStepKey = useGuidedProtocolStore((s) => s.setCurrentStepKey);
  const setStatus = useGuidedProtocolStore((s) => s.setStatus);
  const appendHistory = useGuidedProtocolStore((s) => s.appendHistory);
  const removeHistory = useGuidedProtocolStore((s) => s.removeHistory);
  const canGoBack = useGuidedProtocolStore((s) => s.history.length > 0);
  const ensureClientUuid = useGuidedProtocolStore((s) => s.ensureClientUuid);
  const reset = useGuidedProtocolStore((s) => s.reset);
  const setProtocolId = useGuidedProtocolStore((s) => s.setProtocolId);

  const [step, setStepState] = useState<Step | null>(null);
  const [gateWarnings, setGateWarnings] = useState<GateWarning[]>([]);
  const [completed, setCompleted] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentIteration, setCurrentIteration] = useState(0);

  const loopCountsRef = useRef<Map<string, number>>(new Map());
  const bootstrappedRef = useRef(false);
  const executorRef = useRef<IProtocolExecutor>(apiExecutor);

  const answerMutation = useSubmitAnswer();
  const advanceMutation = useAdvanceStep();
  const backMutation = useGoBack();
  const reminders = useExecutionReminders(
    protocolId,
    !completed,
    () => executorRef.current,
  );

  /** Set the active step, tracking titration loop iterations. */
  const setStep = useCallback((next: Step | null) => {
    setStepState(next);
    if (next?.type === 'titration_loop') {
      const n = (loopCountsRef.current.get(next.id) ?? 0) + 1;
      loopCountsRef.current.set(next.id, n);
      setCurrentIteration(n);
    } else {
      setCurrentIteration(0);
    }
  }, []);

  /** Persist execution state to IndexedDB (write-through). */
  const persistState = useCallback(
    (exec: Execution) => {
      const clientUuid = useGuidedProtocolStore.getState().clientUuid;
      if (!clientUuid) return;
      void saveExecutionState({
        clientUuid,
        currentStepKey: exec.currentStepKey ?? '',
        history: useGuidedProtocolStore.getState().history.map((h) => ({
          stepKey: h.stepKey,
          stepType: h.stepType,
          title: h.title,
          values: h.values,
          answeredAt: h.answeredAt,
        })),
        values: {},
        protocolVersionId: '',
        protocolId: String(protocolId),
        patientName,
        patientId: patientId != null ? String(patientId) : undefined,
        status: exec.status,
        updatedAt: new Date().toISOString(),
      }).catch((err: unknown) => {
        console.error('[execution] Falha ao salvar estado local:', err);
      });
    },
    [protocolId, patientName, patientId],
  );

  /** Enqueue sync snapshot when using local executor online. */
  const enqueueSync = useCallback(
    (exec: Execution) => {
      if (executorRef.current !== localExecutor) return;
      if (!navigator.onLine) return;
      void enqueue('guided:execution-upsert', {
        protocolId,
        clientUuid: exec.clientUuid,
        status: exec.status,
        currentStepKey: exec.currentStepKey,
        history: useGuidedProtocolStore.getState().history,
        patientName,
        patientId,
      }).catch((err: unknown) => {
        console.error('[sync] Falha ao enfileirar execution-upsert:', err);
      });
    },
    [protocolId, patientName, patientId],
  );

  const applyExecution = useCallback(
    (exec: Execution) => {
      setExecutionId(exec.id);
      setStatus(exec.status);
      setCurrentStepKey(exec.currentStepKey ?? null);
      setGateWarnings(exec.gateWarnings ?? []);
      if (exec.status === 'concluido' || !exec.currentStepData) {
        setCompleted(true);
        setStep(null);
      } else {
        setCompleted(false);
        setStep(exec.currentStepData);
      }
      // Write-through to IndexedDB
      persistState(exec);
      // Re-arm reminder timers for the freshly persisted state.
      refreshReminderScheduler();
    },
    [setExecutionId, setStatus, setCurrentStepKey, setStep, persistState],
  );

  const applyStepResponse = useCallback(
    (res: StepResponse) => {
      setGateWarnings(res.gateWarnings ?? []);
      if (res.status === 'concluido' || !res.step) {
        setStatus('concluido');
        setCurrentStepKey(null);
        setCompleted(true);
        setStep(null);
      } else {
        setStatus('em_andamento');
        setCurrentStepKey(res.step.id);
        setCompleted(false);
        setStep(res.step);
      }
    },
    [setStatus, setCurrentStepKey, setStep],
  );

  // Idempotent start-on-mount: restore execution state from IndexedDB by
  // clientUuid (always, not just offline). Pick executor: apiExecutor when
  // online AND server has state; localExecutor when offline OR no server state.
  useEffect(() => {
    if (!patientName || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    // Clear stale run state so a finished execution (or a switch to a different
    // protocol) starts fresh instead of idempotently resuming the old, already
    // "concluído" execution via its retained client_uuid.
    const stored = useGuidedProtocolStore.getState();
    const isFinished =
      stored.status === 'concluido' || stored.status === 'abandonado';
    const isDifferentProtocol =
      stored.protocolId != null && stored.protocolId !== protocolId;
    if (isFinished || isDifferentProtocol) {
      reset();
    }
    setProtocolId(protocolId);

    // Ask for notification permission so reminder timers can surface alerts.
    void requestNotificationPermission();

    (async () => {
      setBootstrapping(true);
      setError(null);

      // Pick executor: prefer API when online, fall back to local
      executorRef.current = navigator.onLine ? apiExecutor : localExecutor;

      try {
        // Try API first (when online)
        if (navigator.onLine) {
          try {
            const res = await apiExecutor.getStep(protocolId);
            executorRef.current = apiExecutor;
            applyStepResponse(res);
            return;
          } catch (err) {
            if (!isNotFound(err)) {
              // Non-404 API error — try local fallback
              const clientUuid = ensureClientUuid();
              const localState = await loadExecutionState(clientUuid);
              if (localState && localState.status === 'em_andamento') {
                executorRef.current = localExecutor;
                await localExecutor.start(
                  protocolId,
                  patientName,
                  clientUuid,
                  patientId,
                );
                const stepRes = await localExecutor.getStep(protocolId);
                applyStepResponse(stepRes);
                setStatus(localState.status);
                return;
              }
              throw err;
            }
          }
        }

        // Offline or 404 from API — restore from IndexedDB
        const clientUuid = ensureClientUuid();
        const localState = await loadExecutionState(clientUuid);

        if (localState && localState.status === 'em_andamento') {
          executorRef.current = localExecutor;
          await localExecutor.start(
            protocolId,
            patientName,
            clientUuid,
            patientId,
          );
          // Hydrate store from saved state
          setCurrentStepKey(localState.currentStepKey);
          setStatus(localState.status);
          for (const entry of localState.history) {
            appendHistory({
              stepKey: entry.stepKey,
              stepType: entry.stepType as import('../types').StepType,
              title: entry.title,
              values: entry.values,
              answeredAt: entry.answeredAt,
            });
          }
          const stepRes = await localExecutor.getStep(protocolId);
          applyStepResponse(stepRes);

          // Load reminders from local state
          const localReminders = await localExecutor.getReminders(protocolId);
          void localReminders; // Reminders are loaded via the query below
          return;
        }

        // No local state — start fresh
        if (navigator.onLine) {
          // API 404 + no local state → start on server
          try {
            const exec = await apiExecutor.start(
              protocolId,
              patientName,
              clientUuid,
              patientId,
            );
            executorRef.current = apiExecutor;
            applyExecution(exec);
            return;
          } catch (startErr) {
            // Server start failed — try local
            try {
              const exec = await localExecutor.start(
                protocolId,
                patientName,
                clientUuid,
                patientId,
              );
              executorRef.current = localExecutor;
              applyExecution(exec);
              return;
            } catch {
              setError(startErr as Error);
              toast.error('Não foi possível iniciar o protocolo. Tente novamente.');
              return;
            }
          }
        }

        // Offline + no local state — start local
        try {
          const exec = await localExecutor.start(
            protocolId,
            patientName,
            clientUuid,
            patientId,
          );
          executorRef.current = localExecutor;
          applyExecution(exec);
        } catch (startErr) {
          setError(startErr as Error);
          toast.error('Não foi possível iniciar o protocolo. Tente novamente.');
        }
      } catch (err) {
        setError(err as Error);
        toast.error('Não foi possível carregar o protocolo. Tente novamente.');
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [
    protocolId,
    patientName,
    patientId,
    applyStepResponse,
    applyExecution,
    ensureClientUuid,
    reset,
    setProtocolId,
    setStatus,
    setCurrentStepKey,
    appendHistory,
  ]);

  /** Answer the current answerable step — exactly one /answer/ call (fix3 #1). */
  const submitAnswer = useCallback(
    async (values: AnswerValues) => {
      if (!step) return;
      const answered = step;
      try {
        const executor = executorRef.current;
        const exec = await executor.answer(protocolId, values);
        appendHistory({
          stepKey: answered.id,
          stepType: answered.type,
          title: answered.title,
          values,
          answeredAt: new Date().toISOString(),
        });
        applyExecution(exec);
        // Sync queue when using local executor online
        enqueueSync(exec);
        if (exec.status === 'concluido') {
          toast.success('Protocolo concluído.');
        }
      } catch {
        toast.error('Erro ao registrar resposta. Tente novamente.');
      }
    },
    [step, protocolId, appendHistory, applyExecution, enqueueSync],
  );

  /** Advance past a display-only step — single /next/ call (fix3 #1). */
  const advance = useCallback(async () => {
    if (!step) return;
    const leaving = step;
    try {
      const executor = executorRef.current;
      const res = await executor.advance(protocolId);
      appendHistory({
        stepKey: leaving.id,
        stepType: leaving.type,
        title: leaving.title,
        values: {},
        answeredAt: new Date().toISOString(),
      });
      applyStepResponse(res);
      if (res.status === 'concluido') {
        toast.success('Protocolo concluído.');
      }
    } catch {
      toast.error('Erro ao avançar. Tente novamente.');
    }
  }, [step, protocolId, appendHistory, applyStepResponse]);

  /** Revert to the previous visited step so a past decision can be redone. */
  const goBack = useCallback(async () => {
    if (!canGoBack) return;
    try {
      const executor = executorRef.current;
      const res = await executor.back(protocolId);
      // The step we return to is reopened for a fresh answer, so drop its
      // recorded decision from the timeline to keep it in sync with the engine.
      if (res.step) removeHistory(res.step.id);
      applyStepResponse(res);
    } catch {
      toast.error('Erro ao voltar. Tente novamente.');
    }
  }, [canGoBack, protocolId, removeHistory, applyStepResponse]);

  return {
    step,
    gateWarnings,
    completed,
    bootstrapping,
    error,
    currentIteration,
    canGoBack,
    submitting:
      answerMutation.isPending ||
      advanceMutation.isPending ||
      backMutation.isPending,
    reminders: reminders.data ?? [],
    submitAnswer,
    advance,
    goBack,
  };
}

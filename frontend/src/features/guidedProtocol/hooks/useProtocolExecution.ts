import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';
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
  concludeExecutionsFor,
  loadExecutionState,
  saveExecutionState,
} from '@/lib/offline/executionState';
import { upsertQueueEntry } from '@/lib/offline/executionQueue';
import { flushSyncQueue } from '@/lib/offline/syncOrchestrator';
import { getProtocol } from '@/lib/offline/protocolCache';
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
  const setProtocolVersionId = useGuidedProtocolStore(
    (s) => s.setProtocolVersionId,
  );
  const queryClient = useQueryClient();

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

  /**
   * Persiste o estado atual da execução.
   * Chamado em toda transição (resposta, avançar, voltar).
   */
  const persistCurrentState = useCallback(() => {
    const snapshot = useGuidedProtocolStore.getState();
    const clientUuid = snapshot.clientUuid;
    if (!clientUuid) return;
    void (async () => {
      const existing = await loadExecutionState(clientUuid);
      const existingByKey = new Map(
        (existing?.history ?? []).map((h) => [h.stepKey, h]),
      );
      await saveExecutionState({
        clientUuid,
        currentStepKey: snapshot.currentStepKey ?? '',
        history: snapshot.history.map((h) => ({
          stepKey: h.stepKey,
          stepType: h.stepType,
          title: h.title,
          values: h.values,
          answeredAt: h.answeredAt,
          loopCount: h.loopCount ?? existingByKey.get(h.stepKey)?.loopCount,
        })),
        values: existing?.values ?? {},
        protocolVersionId:
          snapshot.protocolVersionId ?? existing?.protocolVersionId ?? '',
        protocolId: String(protocolId),
        patientName,
        patientId: patientId != null ? String(patientId) : undefined,
        status: snapshot.status ?? 'em_andamento',
        updatedAt: new Date().toISOString(),
      });
    })().catch((err: unknown) => {
      console.error('[execution] Falha ao salvar estado local:', err);
    });
  }, [protocolId, patientName, patientId]);

  const invalidateExecutionQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['protocols', protocolId, 'reminders'],
    });
    void queryClient.invalidateQueries({ queryKey: ['activeExecution'] });
  }, [queryClient, protocolId]);

  const enqueueSync = useCallback(() => {
    if (executorRef.current !== localExecutor) return;
    const clientUuid = useGuidedProtocolStore.getState().clientUuid;
    if (!clientUuid) return;
    void (async () => {
      // The persisted record (written by localExecutor) is the source of truth.
      const record = await loadExecutionState(clientUuid);
      if (!record) return;
      const states = record.history.map((h) => ({
        stepKey: h.stepKey,
        values: h.values,
        loopCount: h.loopCount ?? 0,
        gateWarnings: [] as unknown[],
        answeredAt: h.answeredAt,
      }));
      await upsertQueueEntry('guided:execution-upsert', clientUuid, {
        clientUuid,
        protocolVersionId: record.protocolVersionId,
        status: record.status,
        currentStepKey: record.currentStepKey,
        states,
        patientName,
        patientId: patientId ?? null,
      });
      flushSyncQueue();
    })().catch((err: unknown) => {
      console.error('[sync] Falha ao enfileirar execution-upsert:', err);
    });
  }, [patientName, patientId]);

  const applyExecution = useCallback(
    (exec: Execution) => {
      setExecutionId(exec.id);
      setStatus(exec.status);
      if (exec.version != null) setProtocolVersionId(String(exec.version));
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
      persistCurrentState();
      // Re-arm reminder timers and refresh the live reminder / dashboard views.
      refreshReminderScheduler();
      invalidateExecutionQueries();
    },
    [
      setExecutionId,
      setStatus,
      setProtocolVersionId,
      setCurrentStepKey,
      setStep,
      persistCurrentState,
      invalidateExecutionQueries,
    ],
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
    // protocol) starts fr  /** Refetch the live reminders and the dashboard "em execução" card. */esh instead of idempotently resuming the old, already
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

      // Seed protocolVersionId from the offline cache up front so a mid-run
      // outage can sync (the server requires protocol_version_id). Online start
      // refines this with exec.version via applyExecution.
      const cached = await getProtocol(String(protocolId));
      if (cached?.current_version?.id != null) {
        setProtocolVersionId(String(cached.current_version.id));
      }

      try {
        // Try API first (when online)
        if (navigator.onLine) {
          try {
            const res = await apiExecutor.getStep(protocolId);
            executorRef.current = apiExecutor;
            applyStepResponse(res);
            // Mirror the resumed step locally so a later outage can fall back.
            persistCurrentState();
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
    setProtocolVersionId,
    setStatus,
    setCurrentStepKey,
    appendHistory,
    persistCurrentState,
  ]);

  // When the run reaches completion (any path), mark every in-progress record
  // for this patient+protocol as concluido so the dashboard card clears — even
  // if the finishing transition persisted under a different clientUuid.
  useEffect(() => {
    if (!completed) return;
    void concludeExecutionsFor(
      patientId != null ? String(patientId) : undefined,
      String(protocolId),
    ).finally(() => invalidateExecutionQueries());
  }, [completed, patientId, protocolId, invalidateExecutionQueries]);

  /**
   * Run a mutating op against the active executor. If we're on apiExecutor and
   * it fails because we've gone offline mid-run, seed localExecutor from the
   * IndexedDB mirror (same clientUuid → resumes at the current step + history),
   * switch over for the rest of the run, and retry locally. This is what lets a
   * run that started online survive an outage without a hard reload.
   */
  const runWithFallback = useCallback(
    async <T>(op: (ex: IProtocolExecutor) => Promise<T>): Promise<T> => {
      const active = executorRef.current;
      try {
        return await op(active);
      } catch (err) {
        const offlineShaped =
          !navigator.onLine || (isAxiosError(err) && !err.response);
        if (active === apiExecutor && offlineShaped) {
          const clientUuid = ensureClientUuid();
          await localExecutor.start(
            protocolId,
            patientName,
            clientUuid,
            patientId,
          );
          executorRef.current = localExecutor;
          return await op(localExecutor);
        }
        throw err;
      }
    },
    [protocolId, patientName, patientId, ensureClientUuid],
  );

  /** Answer the current answerable step — exactly one /answer/ call (fix3 #1). */
  const submitAnswer = useCallback(
    async (values: AnswerValues) => {
      if (!step) return;
      const answered = step;
      try {
        const exec = await runWithFallback((ex) =>
          ex.answer(protocolId, values),
        );
        appendHistory({
          stepKey: answered.id,
          stepType: answered.type,
          title: answered.title,
          values,
          answeredAt: new Date().toISOString(),
        });
        applyExecution(exec);
        // Sync queue when handled by the local executor (offline or post-fallback).
        enqueueSync();
        if (exec.status === 'concluido') {
          toast.success('Protocolo concluído.');
        }
      } catch {
        toast.error('Erro ao registrar resposta. Tente novamente.');
      }
    },
    [step, protocolId, appendHistory, applyExecution, enqueueSync, runWithFallback],
  );

  /** Advance past a display-only step — single /next/ call (fix3 #1). */
  const advance = useCallback(async () => {
    if (!step) return;
    const leaving = step;
    try {
      const res = await runWithFallback((ex) => ex.advance(protocolId));
      appendHistory({
        stepKey: leaving.id,
        stepType: leaving.type,
        title: leaving.title,
        values: {},
        answeredAt: new Date().toISOString(),
      });
      applyStepResponse(res);
      persistCurrentState();
      enqueueSync();
      refreshReminderScheduler();
      invalidateExecutionQueries();
      if (res.status === 'concluido') {
        toast.success('Protocolo concluído.');
      }
    } catch {
      toast.error('Erro ao avançar. Tente novamente.');
    }
  }, [
    step,
    protocolId,
    appendHistory,
    applyStepResponse,
    persistCurrentState,
    enqueueSync,
    runWithFallback,
    invalidateExecutionQueries,
  ]);

  /** Revert to the previous visited step so a past decision can be redone. */
  const goBack = useCallback(async () => {
    if (!canGoBack) return;
    try {
      const res = await runWithFallback((ex) => ex.back(protocolId));
      // The step we return to is reopened for a fresh answer, so drop its
      // recorded decision from the timeline to keep it in sync with the engine.
      if (res.step) removeHistory(res.step.id);
      applyStepResponse(res);
      persistCurrentState();
      enqueueSync();
      refreshReminderScheduler();
      invalidateExecutionQueries();
    } catch {
      toast.error('Erro ao voltar. Tente novamente.');
    }
  }, [
    canGoBack,
    protocolId,
    removeHistory,
    applyStepResponse,
    persistCurrentState,
    enqueueSync,
    runWithFallback,
    invalidateExecutionQueries,
  ]);

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

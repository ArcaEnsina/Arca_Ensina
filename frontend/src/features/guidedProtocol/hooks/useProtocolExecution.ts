import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useGuidedProtocolStore } from '../store';
import { apiExecutor } from '../engine/apiExecutor';
import {
  useAdvanceStep,
  useExecutionReminders,
  useSubmitAnswer,
} from '../api';
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

  const answerMutation = useSubmitAnswer();
  const advanceMutation = useAdvanceStep();
  const reminders = useExecutionReminders(protocolId, !completed);

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
    },
    [setExecutionId, setStatus, setCurrentStepKey, setStep],
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

  // Idempotent start-on-mount: resume the active execution if one exists,
  // otherwise start a fresh one (guarded by a stable client_uuid).
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

    (async () => {
      setBootstrapping(true);
      setError(null);
      try {
        const res = await apiExecutor.getStep(protocolId);
        applyStepResponse(res);
      } catch (err) {
        if (isNotFound(err)) {
          try {
            const exec = await apiExecutor.start(
              protocolId,
              patientName,
              ensureClientUuid(),
              patientId,
            );
            applyExecution(exec);
          } catch (startErr) {
            setError(startErr as Error);
            toast.error('Não foi possível iniciar o protocolo. Tente novamente.');
          }
        } else {
          setError(err as Error);
          toast.error('Não foi possível carregar o protocolo. Tente novamente.');
        }
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
  ]);

  /** Answer the current answerable step — exactly one /answer/ call (fix3 #1). */
  const submitAnswer = useCallback(
    async (values: AnswerValues) => {
      if (!step) return;
      const answered = step;
      try {
        const exec = await answerMutation.mutateAsync({ protocolId, values });
        appendHistory({
          stepKey: answered.id,
          stepType: answered.type,
          title: answered.title,
          values,
          answeredAt: new Date().toISOString(),
        });
        applyExecution(exec);
        if (exec.status === 'concluido') {
          toast.success('Protocolo concluído.');
        }
      } catch {
        toast.error('Erro ao registrar resposta. Tente novamente.');
      }
    },
    [step, protocolId, answerMutation, appendHistory, applyExecution],
  );

  /** Advance past a display-only step — single /next/ call (fix3 #1). */
  const advance = useCallback(async () => {
    if (!step) return;
    const leaving = step;
    try {
      const res = await advanceMutation.mutateAsync({ protocolId });
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
  }, [step, protocolId, advanceMutation, appendHistory, applyStepResponse]);

  return {
    step,
    gateWarnings,
    completed,
    bootstrapping,
    error,
    currentIteration,
    submitting: answerMutation.isPending || advanceMutation.isPending,
    reminders: reminders.data ?? [],
    submitAnswer,
    advance,
  };
}

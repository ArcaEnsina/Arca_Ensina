import { useQuery } from '@tanstack/react-query';
import { GuidedProtocolInterpreter } from '@/engines/protocol';
import {
  listActiveExecutions,
  type ExecutionStateRecord,
} from '@/lib/offline/executionState';
import { getProtocol } from '@/lib/offline/protocolCache';
import { buildReminders } from '../engine/reminders';
import type { HistoryEntry, Reminder, StepType } from '../types';

export interface ActiveExecutionSummary {
  clientUuid: string;
  protocolId: string;
  protocolTitle: string;
  currentStepKey: string;
  history: ExecutionStateRecord['history'];
  completedCount: number;
  reminders: Reminder[];
}

/**
 * O protocolo guiado em andamento para o paciente.
 * Reminders atualizados em tempo real, derivados exatamente como o
 * agendador de primeiro plano. (buildReminders + cached protocol).
 */
export async function loadActiveExecutionForPatient(
  patientId: string,
): Promise<ActiveExecutionSummary | null> {
  const execs = await listActiveExecutions();
  const exec = execs
    .filter(
      (e) =>
        e.status === 'em_andamento' &&
        e.patientId != null &&
        String(e.patientId) === String(patientId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  if (!exec) return null;

  const cached = await getProtocol(exec.protocolId);
  const stepsData = cached?.current_version?.steps_data;
  let reminders: Reminder[] = [];
  if (stepsData) {
    const engine = new GuidedProtocolInterpreter(stepsData);
    reminders = buildReminders(exec.history, (id) => engine.getStep(id));
  }

  return {
    clientUuid: exec.clientUuid,
    protocolId: exec.protocolId,
    protocolTitle: cached?.title ?? 'Protocolo',
    currentStepKey: exec.currentStepKey,
    history: exec.history,
    completedCount: exec.history.length,
    reminders,
  };
}

export function useActiveExecution(patientId: string | null) {
  return useQuery({
    queryKey: ['activeExecution', patientId],
    enabled: patientId != null,
    queryFn: () => loadActiveExecutionForPatient(patientId as string),
    // mantém o status atualizado em tempo real e refetch automático.
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
}

/**
 * Converte um resumo de execução ativa nos argumentos esperados por
 * `useGuidedProtocolStore.primeResume`, para retomar a execução no passo atual.
 */
export function buildResumeArgs(data: ActiveExecutionSummary): {
  clientUuid: string;
  protocolId: number;
  currentStepKey: string | null;
  history: HistoryEntry[];
} {
  return {
    clientUuid: data.clientUuid,
    protocolId: Number(data.protocolId),
    currentStepKey: data.currentStepKey || null,
    history: data.history.map(
      (h): HistoryEntry => ({
        stepKey: h.stepKey,
        stepType: h.stepType as StepType,
        title: h.title,
        values: h.values,
        answeredAt: h.answeredAt,
      }),
    ),
  };
}

export function getSoonestReminder(reminders: Reminder[]): Reminder | null {
  const withDue = reminders.filter((r) => r.dueAt != null);
  if (withDue.length === 0) return null;
  const overdue = withDue.filter((r) => r.status === 'overdue');
  const pool = overdue.length > 0 ? overdue : withDue;
  return pool.reduce((soonest, r) =>
    new Date(r.dueAt as string).getTime() <
    new Date(soonest.dueAt as string).getTime()
      ? r
      : soonest,
  );
}

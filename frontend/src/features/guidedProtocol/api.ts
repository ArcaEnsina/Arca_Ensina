import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { deepToCamelCase, apiExecutor } from './engine/apiExecutor';
import type { IProtocolExecutor } from './engine/executor';
import type { AnswerValues, GuidedProtocol, Reminder } from './types';

/** List protocols, filtered to the guided (`guiado`) runner type. */
export function useGuidedProtocols() {
  return useQuery<GuidedProtocol[]>({
    queryKey: ['protocols', 'guided'],
    queryFn: async () => {
      const res = await api.get('protocols/', { params: { type: 'guiado' } });
      const data = deepToCamelCase(res.data) as GuidedProtocol[];
      // Defensive: keep only guided protocols even if the filter is ignored.
      return data.filter(
        (p) => !p.currentVersionType || p.currentVersionType === 'guiado',
      );
    },
    staleTime: 5 * 60_000,
  });
}

/** Start (or idempotently resume) an execution. */
export function useStartExecution() {
  return useMutation({
    mutationFn: ({
      protocolId,
      patientName,
      clientUuid,
      patientId,
    }: {
      protocolId: number;
      patientName: string;
      clientUuid: string;
      patientId?: number | null;
    }) => apiExecutor.start(protocolId, patientName, clientUuid, patientId),
    retry: 0,
  });
}

/** Submit an answer for the current answerable step. Safety-critical: retry 0. */
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({
      protocolId,
      values,
    }: {
      protocolId: number;
      values: AnswerValues;
    }) => apiExecutor.answer(protocolId, values),
    retry: 0,
  });
}

/** Advance past a display-only step. Safety-critical: retry 0. */
export function useAdvanceStep() {
  return useMutation({
    mutationFn: ({ protocolId }: { protocolId: number }) =>
      apiExecutor.advance(protocolId),
    retry: 0,
  });
}

/** Revert to the previous step to redo a decision. Safety-critical: retry 0. */
export function useGoBack() {
  return useMutation({
    mutationFn: ({ protocolId }: { protocolId: number }) =>
      apiExecutor.back(protocolId),
    retry: 0,
  });
}

/** Poll in-execution reminders for the live wait_reassess countdown. */
export function useExecutionReminders(
  protocolId: number | null,
  enabled = true,
  getExecutor: () => IProtocolExecutor = () => apiExecutor,
) {
  return useQuery<Reminder[]>({
    queryKey: ['protocols', protocolId, 'reminders'],
    // Resolve o executor a cada poll: apiExecutor online, localExecutor offline
    queryFn: () => getExecutor().getReminders(protocolId as number),
    enabled: enabled && protocolId != null,
    refetchInterval: 30_000,
    retry: 0,
  });
}

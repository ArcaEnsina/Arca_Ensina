import { create } from 'zustand';
import type { ExecutionStatus, HistoryEntry } from './types';

interface GuidedProtocolState {
  protocolId: number | null;
  executionId: number | null;
  clientUuid: string | null;
  /** Server id of the protocol version in play — required by the sync contract. */
  protocolVersionId: string | null;
  currentStepKey: string | null;
  status: ExecutionStatus | null;
  history: HistoryEntry[];

  setProtocolId: (id: number | null) => void;
  setExecutionId: (id: number | null) => void;
  setProtocolVersionId: (id: string | null) => void;
  setCurrentStepKey: (key: string | null) => void;
  setStatus: (status: ExecutionStatus | null) => void;
  appendHistory: (entry: HistoryEntry) => void;
  /** Drop a step's decision from the timeline (e.g. when going back to redo it). */
  removeHistory: (stepKey: string) => void;
  ensureClientUuid: () => string;
  /**
   * Seed state para resumir uma execução existente.
   */
  primeResume: (args: {
    clientUuid: string;
    protocolId: number;
    currentStepKey: string | null;
    history: HistoryEntry[];
  }) => void;
  /** Reset all execution state (e.g. when switching protocols). */
  reset: () => void;
}

export const useGuidedProtocolStore = create<GuidedProtocolState>((set, get) => ({
  protocolId: null,
  executionId: null,
  clientUuid: null,
  protocolVersionId: null,
  currentStepKey: null,
  status: null,
  history: [],

  setProtocolId: (id) => set({ protocolId: id }),
  setExecutionId: (id) => set({ executionId: id }),
  setProtocolVersionId: (id) => set({ protocolVersionId: id }),
  setCurrentStepKey: (key) => set({ currentStepKey: key }),
  setStatus: (status) => set({ status }),
  appendHistory: (entry) =>
    set((state) => {
      const filtered = state.history.filter((h) => h.stepKey !== entry.stepKey);
      return { history: [...filtered, entry] };
    }),
  removeHistory: (stepKey) =>
    set((state) => ({
      history: state.history.filter((h) => h.stepKey !== stepKey),
    })),
  ensureClientUuid: () => {
    const existing = get().clientUuid;
    if (existing) return existing;
    const uuid = crypto.randomUUID();
    set({ clientUuid: uuid });
    return uuid;
  },
  primeResume: ({ clientUuid, protocolId, currentStepKey, history }) =>
    set({
      executionId: null,
      clientUuid,
      protocolId,
      status: 'em_andamento',
      currentStepKey,
      history,
    }),
  reset: () =>
    set({
      executionId: null,
      clientUuid: null,
      protocolVersionId: null,
      currentStepKey: null,
      status: null,
      history: [],
    }),
}));

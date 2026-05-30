import { create } from 'zustand';
import type { ExecutionStatus, HistoryEntry } from './types';

interface GuidedProtocolState {
  protocolId: number | null;
  executionId: number | null;
  clientUuid: string | null;
  currentStepKey: string | null;
  status: ExecutionStatus | null;
  history: HistoryEntry[];

  setProtocolId: (id: number | null) => void;
  setExecutionId: (id: number | null) => void;
  setCurrentStepKey: (key: string | null) => void;
  setStatus: (status: ExecutionStatus | null) => void;
  appendHistory: (entry: HistoryEntry) => void;
  ensureClientUuid: () => string;
  /** Reset all execution state (e.g. when switching protocols). */
  reset: () => void;
}

export const useGuidedProtocolStore = create<GuidedProtocolState>((set, get) => ({
  protocolId: null,
  executionId: null,
  clientUuid: null,
  currentStepKey: null,
  status: null,
  history: [],

  setProtocolId: (id) => set({ protocolId: id }),
  setExecutionId: (id) => set({ executionId: id }),
  setCurrentStepKey: (key) => set({ currentStepKey: key }),
  setStatus: (status) => set({ status }),
  appendHistory: (entry) =>
    set((state) => {
      const filtered = state.history.filter((h) => h.stepKey !== entry.stepKey);
      return { history: [...filtered, entry] };
    }),
  ensureClientUuid: () => {
    const existing = get().clientUuid;
    if (existing) return existing;
    const uuid = crypto.randomUUID();
    set({ clientUuid: uuid });
    return uuid;
  },
  reset: () =>
    set({
      executionId: null,
      clientUuid: null,
      currentStepKey: null,
      status: null,
      history: [],
    }),
}));

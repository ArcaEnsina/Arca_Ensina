import { create } from 'zustand';
import type { SedationPhase } from './types';

interface SedationState {
  phase: SedationPhase;
  setPhase: (p: SedationPhase) => void;
  expandedDays: Record<number, boolean>;
  toggleDay: (day: number) => void;
  resetPanel: () => void;
}

export const useSedationStore = create<SedationState>((set) => ({
  phase: 'select',
  setPhase: (p) => set({ phase: p }),
  expandedDays: {},
  toggleDay: (day) =>
    set((state) => ({
      expandedDays: {
        ...state.expandedDays,
        [day]: !state.expandedDays[day],
      },
    })),
  resetPanel: () => set({ phase: 'select', expandedDays: {} }),
}));

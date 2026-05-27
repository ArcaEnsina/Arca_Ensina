import { create } from 'zustand';
import type { SedationPhase } from './types';

interface SedationState {
  phase: SedationPhase;
  sourceDrugId: string | null;
  targetDrugId: string | null;
  currentDose: string;
  setPhase: (p: SedationPhase) => void;
  setSourceDrug: (id: string | null) => void;
  setTargetDrug: (id: string | null) => void;
  setCurrentDose: (dose: string) => void;
  resetPanel: () => void;
}

export const useSedationStore = create<SedationState>((set) => ({
  phase: 'select',
  sourceDrugId: null,
  targetDrugId: null,
  currentDose: '',
  setPhase: (p) => set({ phase: p }),
  setSourceDrug: (id) => set({ sourceDrugId: id, targetDrugId: null }),
  setTargetDrug: (id) => set({ targetDrugId: id }),
  setCurrentDose: (dose) => set({ currentDose: dose }),
  resetPanel: () =>
    set({
      phase: 'select',
      sourceDrugId: null,
      targetDrugId: null,
      currentDose: '',
    }),
}));

import { create } from 'zustand';
import type { Patient } from './types';

interface PatientState {
  activePatient: Patient | null;
  setActivePatient: (p: Patient) => void;
  clearPatient: () => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  activePatient: null,
  setActivePatient: (p) => set({ activePatient: p }),
  clearPatient: () => set({ activePatient: null }),
}));

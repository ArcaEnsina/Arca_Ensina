import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSedationPanel } from './useSedationPanel';
import { usePatientStore } from '@/features/patient/store';
import type { Patient } from '@/features/patient/types';

// Mock api hooks
const mockCalculateMutate = vi.fn();
const mockPrescribeMutate = vi.fn();
vi.mock('../api', () => ({
  usePanelCalculate: () => ({
    mutate: mockCalculateMutate,
    isPending: false,
    error: null,
  }),
  useCreatePrescription: () => ({
    mutate: mockPrescribeMutate,
    isPending: false,
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Helper: set a patient in the store
function setActivePatient(patient: Patient) {
  usePatientStore.getState().setActivePatient(patient);
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useSedationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    usePatientStore.getState().clearPatient();
  });

  it('returns initial state with phase=select', () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.phase).toBe('select');
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.calculate).toBe('function');
  });

  it('pre-fills patient weight from active patient', () => {
    setActivePatient({
      id: '123',
      nome: 'João Silva',
      dataNascimento: '2020-01-15',
      genero: 'M',
      telefone: '5581999999999',
      peso: '22.5',
      altura: '110',
      alergias: [],
      sintomas: [],
    });

    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.form.getValues('patientWeight')).toBe('22.5');
  });

  it('starts with empty patientWeight when no active patient', () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.form.getValues('patientWeight')).toBe('');
  });

  it('returns form with correct default values', () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    const values = result.current.form.getValues();
    expect(values.sourceDrugId).toBe('');
    expect(values.targetDrugId).toBe('');
    expect(values.route).toBe('');
    expect(values.currentDose).toBe('');
    expect(values.patientWeight).toBe('');
  });

  it('setPhase updates the phase', async () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.phase).toBe('select');

    await act(async () => {
      result.current.setPhase('convert');
    });

    expect(result.current.phase).toBe('convert');
  });
});

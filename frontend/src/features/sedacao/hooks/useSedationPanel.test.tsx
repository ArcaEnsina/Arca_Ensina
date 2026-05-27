import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSedationPanel } from './useSedationPanel';
import { usePatientStore } from '@/features/patient/store';

// Mock api hooks
const mockCalculateMutate = vi.fn();
const mockConversionMutate = vi.fn();
vi.mock('../api', () => ({
  usePanelCalculate: () => ({
    mutate: mockCalculateMutate,
    isPending: false,
    error: null,
  }),
  useCreateConversion: () => ({
    mutate: mockConversionMutate,
    isPending: false,
  }),
  getTaperSchedule: () => null,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useSedationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('setPhase updates the phase', async () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.phase).toBe('select');

    await act(async () => {
      result.current.setPhase('convert');
    });

    expect(result.current.phase).toBe('convert');
  });

  it('returns wizard navigation functions', () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(typeof result.current.goToSelect).toBe('function');
    expect(typeof result.current.goToConvert).toBe('function');
    expect(typeof result.current.goToTaper).toBe('function');
    expect(typeof result.current.onFinish).toBe('function');
  });

  it('returns null taperSchedule when no sourceDrugId', () => {
    const { result } = renderHook(() => useSedationPanel(), { wrapper });

    expect(result.current.taperSchedule).toBeNull();
  });
});

import { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProtocolExecution } from './useProtocolExecution';
import { useGuidedProtocolStore } from '../store';
import type { Execution, StepResponse, YesNoStepData } from '../types';

const yesNoStep: YesNoStepData = {
  id: 'step_c_avaliacao1',
  type: 'yes_no',
  title: 'Resposta satisfatória?',
  trueNext: 'step_c_manutencao',
  falseNext: 'step_c_repeticao',
};

const mockGetStep = vi.fn();
const mockStart = vi.fn();
const mockAnswer = vi.fn();
const mockAdvance = vi.fn();

vi.mock('../engine/apiExecutor', () => ({
  apiExecutor: {
    getStep: (...args: unknown[]) => mockGetStep(...args),
    start: (...args: unknown[]) => mockStart(...args),
  },
}));

vi.mock('../api', () => ({
  useSubmitAnswer: () => ({ mutateAsync: mockAnswer, isPending: false }),
  useAdvanceStep: () => ({ mutateAsync: mockAdvance, isPending: false }),
  useExecutionReminders: () => ({ data: [] }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useProtocolExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGuidedProtocolStore.getState().reset();
  });

  it('resumes the active execution on mount via execute/step/', async () => {
    const stepResponse: StepResponse = { step: yesNoStep, gateWarnings: [] };
    mockGetStep.mockResolvedValue(stepResponse);

    const { result } = renderHook(
      () => useProtocolExecution({ protocolId: 1, patientName: 'Maria' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.bootstrapping).toBe(false));
    expect(mockGetStep).toHaveBeenCalledTimes(1);
    expect(mockStart).not.toHaveBeenCalled();
    expect(result.current.step?.id).toBe('step_c_avaliacao1');
  });

  it('answerable step calls /answer/ exactly once and never /next/', async () => {
    mockGetStep.mockResolvedValue({ step: yesNoStep, gateWarnings: [] });
    const concluido: Execution = {
      id: 7,
      patientName: 'Maria',
      status: 'concluido',
      currentStepKey: null,
      currentStepData: null,
      gateWarnings: [],
    };
    mockAnswer.mockResolvedValue(concluido);

    const { result } = renderHook(
      () => useProtocolExecution({ protocolId: 1, patientName: 'Maria' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bootstrapping).toBe(false));

    await act(async () => {
      await result.current.submitAnswer({ answer: true });
    });

    expect(mockAnswer).toHaveBeenCalledTimes(1);
    expect(mockAnswer).toHaveBeenCalledWith({ protocolId: 1, values: { answer: true } });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('marks the execution complete when answer returns status concluido', async () => {
    mockGetStep.mockResolvedValue({ step: yesNoStep, gateWarnings: [] });
    mockAnswer.mockResolvedValue({
      id: 7,
      patientName: 'Maria',
      status: 'concluido',
      currentStepKey: null,
      currentStepData: null,
      gateWarnings: [],
    } satisfies Execution);

    const { result } = renderHook(
      () => useProtocolExecution({ protocolId: 1, patientName: 'Maria' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bootstrapping).toBe(false));

    await act(async () => {
      await result.current.submitAnswer({ answer: false });
    });

    expect(result.current.completed).toBe(true);
    expect(result.current.step).toBeNull();
  });
});

import { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
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
const mockBack = vi.fn();
const mockGetReminders = vi.fn().mockResolvedValue([]);

// Local executor doubles for the offline-fallback path.
const mockLocalStart = vi.fn();
const mockLocalAnswer = vi.fn();
const mockLocalGetStep = vi.fn();

vi.mock('../engine/apiExecutor', () => ({
  apiExecutor: {
    getStep: (...args: unknown[]) => mockGetStep(...args),
    start: (...args: unknown[]) => mockStart(...args),
    answer: (...args: unknown[]) => mockAnswer(...args),
    advance: (...args: unknown[]) => mockAdvance(...args),
    back: (...args: unknown[]) => mockBack(...args),
    getReminders: (...args: unknown[]) => mockGetReminders(...args),
  },
}));

vi.mock('../engine/localExecutor', () => ({
  localExecutor: {
    start: (...args: unknown[]) => mockLocalStart(...args),
    answer: (...args: unknown[]) => mockLocalAnswer(...args),
    getStep: (...args: unknown[]) => mockLocalGetStep(...args),
    advance: vi.fn(),
    back: vi.fn(),
    getReminders: vi.fn().mockResolvedValue([]),
  },
  __resetLocalEngines: vi.fn(),
}));

vi.mock('../api', () => ({
  useSubmitAnswer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAdvanceStep: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGoBack: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExecutionReminders: () => ({ data: [] }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

/** AxiosError without a `response` — the shape of a network/offline failure. */
function offlineError(): AxiosError {
  return new AxiosError('Network Error', 'ERR_NETWORK');
}

describe('useProtocolExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReminders.mockResolvedValue([]);
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

  it('answerable step calls the executor answer exactly once and never advance', async () => {
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
      await result.current.submitAnswer({ answer: true });
    });

    expect(mockAnswer).toHaveBeenCalledTimes(1);
    expect(mockAnswer).toHaveBeenCalledWith(1, { answer: true });
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

  it('goBack reverts to the previous step and trims the timeline', async () => {
    mockGetStep.mockResolvedValue({ step: yesNoStep, gateWarnings: [] });
    mockAnswer.mockResolvedValue({
      id: 7,
      patientName: 'Maria',
      status: 'em_andamento',
      currentStepKey: 'step_c_manutencao',
      currentStepData: { id: 'step_c_manutencao', type: 'info', title: 'Manutenção' },
      gateWarnings: [],
    } satisfies Execution);
    mockBack.mockResolvedValue({ step: yesNoStep, gateWarnings: [] });

    const { result } = renderHook(
      () => useProtocolExecution({ protocolId: 1, patientName: 'Maria' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bootstrapping).toBe(false));
    expect(result.current.canGoBack).toBe(false);

    await act(async () => {
      await result.current.submitAnswer({ answer: true });
    });
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.step?.id).toBe('step_c_manutencao');

    await act(async () => {
      await result.current.goBack();
    });

    expect(mockBack).toHaveBeenCalledWith(1);
    expect(result.current.step?.id).toBe('step_c_avaliacao1');
    expect(result.current.canGoBack).toBe(false);
  });

  it('falls back to the local executor when the network drops mid-run', async () => {
    // Bootstrapped online at step_c_avaliacao1.
    mockGetStep.mockResolvedValue({ step: yesNoStep, gateWarnings: [] });
    // The online answer fails offline-shaped (no response).
    mockAnswer.mockRejectedValue(offlineError());
    // Local executor resumes from the snapshot and serves the answer locally.
    mockLocalStart.mockResolvedValue({
      id: 0,
      clientUuid: 'uuid-x',
      patientName: 'Maria',
      status: 'em_andamento',
      currentStepKey: 'step_c_avaliacao1',
      currentStepData: yesNoStep,
      gateWarnings: [],
    } satisfies Execution);
    mockLocalAnswer.mockResolvedValue({
      id: 0,
      clientUuid: 'uuid-x',
      patientName: 'Maria',
      status: 'em_andamento',
      currentStepKey: 'step_c_manutencao',
      currentStepData: { id: 'step_c_manutencao', type: 'info', title: 'Manutenção' },
      gateWarnings: [],
    } satisfies Execution);

    const { result } = renderHook(
      () => useProtocolExecution({ protocolId: 1, patientName: 'Maria' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.bootstrapping).toBe(false));

    await act(async () => {
      await result.current.submitAnswer({ answer: true });
    });

    // Tried the API once, then seeded + retried locally — no error, run advanced.
    expect(mockAnswer).toHaveBeenCalledTimes(1);
    expect(mockLocalStart).toHaveBeenCalledTimes(1);
    expect(mockLocalAnswer).toHaveBeenCalledWith(1, { answer: true });
    expect(result.current.step?.id).toBe('step_c_manutencao');
  });
});

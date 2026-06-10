import type { IProtocolExecutor } from './executor';
import type {
  AnswerValues,
  Execution,
  GateWarning,
  Reminder,
  StepResponse,
} from '../types';
import { GuidedProtocolInterpreter } from '@/engines/protocol';
import { buildReminders } from './reminders';
import {
  saveExecutionState,
  loadExecutionState,
  type ExecutionStateRecord,
} from '@/lib/offline/executionState';
import { getProtocol, type CachedProtocol } from '@/lib/offline/protocolCache';

interface LocalExecutionState {
  engine: GuidedProtocolInterpreter;
  state: ExecutionStateRecord;
}

const engines = new Map<string, LocalExecutionState>();

function getStepsData(cachedProtocol: CachedProtocol): Record<string, unknown> | null {
  return cachedProtocol.current_version?.steps_data ?? null;
}

function buildExecutionFromState(
  state: ExecutionStateRecord,
  engine: GuidedProtocolInterpreter,
  gateWarnings: GateWarning[] = [],
): Execution {
  const step = state.currentStepKey ? engine.getStep(state.currentStepKey) : undefined;
  return {
    id: 0, // local execution has no server id
    clientUuid: state.clientUuid,
    status: state.status,
    patientName: state.patientName,
    currentStepKey: state.currentStepKey,
    currentStepData: step ?? null,
    gateWarnings,
  };
}

function buildStepResponse(
  stepId: string,
  engine: GuidedProtocolInterpreter,
  context: Record<string, unknown>,
): StepResponse {
  const step = engine.getStep(stepId);
  if (!step) return { step: null, gateWarnings: [], status: 'concluido' };

  const gateWarnings = engine.evaluateStepGates(stepId, context);
  return {
    step,
    gateWarnings,
    status: 'em_andamento',
  };
}

export const localExecutor: IProtocolExecutor = {
  async start(
    protocolId: number,
    patientName: string,
    clientUuid: string,
    patientId?: number | null,
  ): Promise<Execution> {
    // Try to resume existing local state
    const existingState = await loadExecutionState(clientUuid);
    if (existingState && existingState.status === 'em_andamento') {
      const cachedProtocol = await getProtocol(String(protocolId));
      if (!cachedProtocol || !getStepsData(cachedProtocol)) {
        throw new Error('Protocolo nao encontrado no cache local');
      }
      const engine = new GuidedProtocolInterpreter(getStepsData(cachedProtocol));
      engines.set(clientUuid, { engine, state: existingState });
      return buildExecutionFromState(existingState, engine);
    }

    // Fetch protocol from IndexedDB cache
    const cachedProtocol = await getProtocol(String(protocolId));
    if (!cachedProtocol || !getStepsData(cachedProtocol)) {
      throw new Error('Protocolo nao encontrado no cache local');
    }

    const stepsData = getStepsData(cachedProtocol)!;
    const engine = new GuidedProtocolInterpreter(stepsData);
    const firstStepId = engine.getFirstStepId();

    if (!firstStepId) {
      throw new Error('Protocolo sem passos definidos');
    }

    const initialState: ExecutionStateRecord = {
      clientUuid,
      currentStepKey: firstStepId,
      history: [],
      values: {},
      protocolVersionId: cachedProtocol.current_version?.id ?? '',
      protocolId: String(protocolId),
      patientName,
      patientId: patientId != null ? String(patientId) : undefined,
      status: 'em_andamento',
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(initialState);
    engines.set(clientUuid, { engine, state: initialState });

    const gateWarnings = engine.evaluateEntryGates({});
    return buildExecutionFromState(initialState, engine, gateWarnings);
  },

  async getStep(protocolId: number): Promise<StepResponse> {
    // We need a clientUuid to look up state. Try to find it from engines map.
    // Fallback: scan IndexedDB for active executions matching this protocol.
    let localState: LocalExecutionState | undefined;

    for (const [, entry] of engines) {
      if (entry.state.protocolId === String(protocolId)) {
        localState = entry;
        break;
      }
    }

    if (!localState) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }

    const { engine, state } = localState;
    if (state.status === 'concluido') {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    const context = engine.buildContext(state.history, state.values);
    return buildStepResponse(state.currentStepKey, engine, context);
  },

  async answer(protocolId: number, values: AnswerValues): Promise<Execution> {
    let localState: LocalExecutionState | undefined;
    let clientUuid: string | undefined;

    for (const [uuid, entry] of engines) {
      if (entry.state.protocolId === String(protocolId)) {
        localState = entry;
        clientUuid = uuid;
        break;
      }
    }

    if (!localState || !clientUuid) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }

    const { engine, state } = localState;
    const currentStep = engine.getStep(state.currentStepKey);

    if (!currentStep) {
      throw new Error(`Passo nao encontrado: ${state.currentStepKey}`);
    }

    // Apply derived_calc if applicable
    let resolvedValues = { ...values };
    if (currentStep.type === 'derived_calc') {
      const context = engine.buildContext(state.history, state.values);
      resolvedValues = engine.applyDerivedCalculation(
        state.currentStepKey,
        resolvedValues,
        context,
      );
    }

    // Record history entry
    const historyEntry = {
      stepKey: state.currentStepKey,
      stepType: currentStep.type,
      title: currentStep.title,
      values: resolvedValues,
      answeredAt: new Date().toISOString(),
    };

    // Build context for gate evaluation on next step
    const updatedHistory = [...state.history, historyEntry];
    const updatedValues = { ...state.values, ...resolvedValues };
    const context = engine.buildContext(updatedHistory, {});

    // Resolve next step
    const loopCount = (state.values.__loopCount as number) ?? 0;
    const { nextStepId, state: newEngineState } = engine.resolveNextStepId(
      state.currentStepKey,
      resolvedValues,
      { loopCount },
    );

    // Update values with loop count
    updatedValues.__loopCount = newEngineState.loopCount;

    let newStatus: ExecutionStateRecord['status'] = 'em_andamento';
    let finalStepKey = nextStepId ?? '';

    if (!nextStepId) {
      newStatus = 'concluido';
    }

    const newState: ExecutionStateRecord = {
      ...state,
      currentStepKey: finalStepKey,
      history: updatedHistory,
      values: updatedValues,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(newState);
    engines.set(clientUuid, { engine, state: newState });

    // Gate warnings for the new current step
    const gateWarnings = nextStepId
      ? engine.evaluateStepGates(nextStepId, context)
      : [];

    return buildExecutionFromState(newState, engine, gateWarnings);
  },

  async advance(protocolId: number): Promise<StepResponse> {
    let localState: LocalExecutionState | undefined;
    let clientUuid: string | undefined;

    for (const [uuid, entry] of engines) {
      if (entry.state.protocolId === String(protocolId)) {
        localState = entry;
        clientUuid = uuid;
        break;
      }
    }

    if (!localState || !clientUuid) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }

    const { engine, state } = localState;
    const currentStep = engine.getStep(state.currentStepKey);

    if (!currentStep) {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    // Record history entry for the display-only step
    const historyEntry = {
      stepKey: state.currentStepKey,
      stepType: currentStep.type,
      title: currentStep.title,
      values: {},
      answeredAt: new Date().toISOString(),
    };

    // Resolve next step (display-only steps have simple next_step)
    const { nextStepId } = engine.resolveNextStepId(
      state.currentStepKey,
      {},
      { loopCount: (state.values.__loopCount as number) ?? 0 },
    );

    let newStatus: ExecutionStateRecord['status'] = 'em_andamento';
    let finalStepKey = nextStepId ?? '';

    if (!nextStepId) {
      newStatus = 'concluido';
    }

    const newState: ExecutionStateRecord = {
      ...state,
      currentStepKey: finalStepKey,
      history: [...state.history, historyEntry],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(newState);
    engines.set(clientUuid, { engine, state: newState });

    if (!nextStepId) {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    const context = engine.buildContext(newState.history, newState.values);
    return buildStepResponse(nextStepId, engine, context);
  },

  async back(protocolId: number): Promise<StepResponse> {
    let localState: LocalExecutionState | undefined;
    let clientUuid: string | undefined;

    for (const [uuid, entry] of engines) {
      if (entry.state.protocolId === String(protocolId)) {
        localState = entry;
        clientUuid = uuid;
        break;
      }
    }

    if (!localState || !clientUuid) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }

    const { engine, state } = localState;

    if (state.history.length === 0) {
      // No history to go back to — return current step
      const context = engine.buildContext([], state.values);
      return buildStepResponse(state.currentStepKey, engine, context);
    }

    // Pop last history entry
    const newHistory = [...state.history];
    const lastEntry = newHistory.pop()!;

    // Rebuild values from remaining history
    const remainingValues: AnswerValues = {};
    for (const entry of newHistory) {
      Object.assign(remainingValues, entry.values);
    }

    const newState: ExecutionStateRecord = {
      ...state,
      currentStepKey: lastEntry.stepKey,
      history: newHistory,
      values: remainingValues,
      status: 'em_andamento',
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(newState);
    engines.set(clientUuid, { engine, state: newState });

    const context = engine.buildContext(newHistory, remainingValues);
    return buildStepResponse(lastEntry.stepKey, engine, context);
  },

  async getReminders(protocolId: number): Promise<Reminder[]> {
    let localState: LocalExecutionState | undefined;

    for (const [, entry] of engines) {
      if (entry.state.protocolId === String(protocolId)) {
        localState = entry;
        break;
      }
    }

    if (!localState) return [];

    const { engine, state } = localState;
    return buildReminders(state.history, (id) => engine.getStep(id));
  },
};

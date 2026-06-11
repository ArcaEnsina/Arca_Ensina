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
/**
 * O clientUuid ativo para cada protocolId. Torna a busca por operação
 * determinística (a última execução iniciada prevalece).
 */
const activeByProtocol = new Map<string, string>();

/** Obtém a execução ativa de um protocolo usando o mapeamento activeByProtocol → engines. */
function resolveActive(
  protocolId: number,
): { clientUuid: string; entry: LocalExecutionState } | undefined {
  const clientUuid = activeByProtocol.get(String(protocolId));
  if (!clientUuid) return undefined;
  const entry = engines.get(clientUuid);
  if (!entry) return undefined;
  return { clientUuid, entry };
}

/** Descarta uma execução concluída para impedir que ela sobreponha uma nova inicialização do mesmo protocolo. */
function purgeRun(protocolId: number, clientUuid: string): void {
  engines.delete(clientUuid);
  if (activeByProtocol.get(String(protocolId)) === clientUuid) {
    activeByProtocol.delete(String(protocolId));
  }
}

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
      // A run that started online and is now falling back may have persisted an
      // empty protocolVersionId; refresh it from the cache so sync has a valid id.
      const resumedState: ExecutionStateRecord = {
        ...existingState,
        protocolVersionId:
          existingState.protocolVersionId ||
          String(cachedProtocol.current_version?.id ?? ''),
      };
      if (resumedState.protocolVersionId !== existingState.protocolVersionId) {
        await saveExecutionState(resumedState);
      }
      engines.set(clientUuid, { engine, state: resumedState });
      activeByProtocol.set(String(protocolId), clientUuid);
      return buildExecutionFromState(resumedState, engine);
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
    activeByProtocol.set(String(protocolId), clientUuid);

    const gateWarnings = engine.evaluateEntryGates({});
    return buildExecutionFromState(initialState, engine, gateWarnings);
  },

  async getStep(protocolId: number): Promise<StepResponse> {
    const active = resolveActive(protocolId);
    if (!active) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }

    const { engine, state } = active.entry;
    if (state.status === 'concluido') {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    const context = engine.buildContext(state.history, state.values);
    return buildStepResponse(state.currentStepKey, engine, context);
  },

  async answer(protocolId: number, values: AnswerValues): Promise<Execution> {
    const active = resolveActive(protocolId);
    if (!active) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }
    const { clientUuid, entry } = active;

    const { engine, state } = entry;
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

    // Loop counter in effect when this step is resolved — recorded on the
    // history entry so the synced state's loop_count matches the server's
    // parity replay (views.py resolve_next_step_id).
    const loopCount = (state.values.__loopCount as number) ?? 0;

    // Record history entry
    const historyEntry = {
      stepKey: state.currentStepKey,
      stepType: currentStep.type,
      title: currentStep.title,
      values: resolvedValues,
      answeredAt: new Date().toISOString(),
      loopCount,
    };

    // Build context for gate evaluation on next step
    const updatedHistory = [...state.history, historyEntry];
    const updatedValues = { ...state.values, ...resolvedValues };
    const context = engine.buildContext(updatedHistory, {});

    // Resolve next step
    const { nextStepId, state: newEngineState } = engine.resolveNextStepId(
      state.currentStepKey,
      resolvedValues,
      { loopCount },
    );

    // Update values with loop count
    updatedValues.__loopCount = newEngineState.loopCount;

    const finalStepKey = nextStepId ?? '';
    const newStatus: ExecutionStateRecord['status'] = nextStepId
      ? 'em_andamento'
      : 'concluido';

    const newState: ExecutionStateRecord = {
      ...state,
      currentStepKey: finalStepKey,
      history: updatedHistory,
      values: updatedValues,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(newState);
    if (newStatus === 'concluido') {
      purgeRun(protocolId, clientUuid);
    } else {
      engines.set(clientUuid, { engine, state: newState });
    }

    // Gate warnings for the new current step
    const gateWarnings = nextStepId
      ? engine.evaluateStepGates(nextStepId, context)
      : [];

    return buildExecutionFromState(newState, engine, gateWarnings);
  },

  async advance(protocolId: number): Promise<StepResponse> {
    const active = resolveActive(protocolId);
    if (!active) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }
    const { clientUuid, entry } = active;

    const { engine, state } = entry;
    const currentStep = engine.getStep(state.currentStepKey);

    if (!currentStep) {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    const loopCount = (state.values.__loopCount as number) ?? 0;

    // Record history entry for the display-only step
    const historyEntry = {
      stepKey: state.currentStepKey,
      stepType: currentStep.type,
      title: currentStep.title,
      values: {},
      answeredAt: new Date().toISOString(),
      loopCount,
    };

    // Resolve next step (display-only steps have simple next_step)
    const { nextStepId } = engine.resolveNextStepId(
      state.currentStepKey,
      {},
      { loopCount },
    );

    const finalStepKey = nextStepId ?? '';
    const newStatus: ExecutionStateRecord['status'] = nextStepId
      ? 'em_andamento'
      : 'concluido';

    const newState: ExecutionStateRecord = {
      ...state,
      currentStepKey: finalStepKey,
      history: [...state.history, historyEntry],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveExecutionState(newState);
    if (newStatus === 'concluido') {
      purgeRun(protocolId, clientUuid);
    } else {
      engines.set(clientUuid, { engine, state: newState });
    }

    if (!nextStepId) {
      return { step: null, gateWarnings: [], status: 'concluido' };
    }

    const context = engine.buildContext(newState.history, newState.values);
    return buildStepResponse(nextStepId, engine, context);
  },

  async back(protocolId: number): Promise<StepResponse> {
    const active = resolveActive(protocolId);
    if (!active) {
      throw new Error('Nao ha estado local ativo para este protocolo');
    }
    const { clientUuid, entry: localState } = active;

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
    // Restore the loop counter to what it was when the step we're returning to
    // was resolved, so re-answering it branches identically.
    remainingValues.__loopCount = lastEntry.loopCount ?? 0;

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
    const active = resolveActive(protocolId);
    if (!active) return [];

    const { engine, state } = active.entry;
    return buildReminders(state.history, (id) => engine.getStep(id));
  },
};

/** Test-only: clear all in-memory engine state between cases. */
export function __resetLocalEngines(): void {
  engines.clear();
  activeByProtocol.clear();
}

import type { AnswerValues, GateWarning, Step } from '@/features/guidedProtocol/types';
import { evaluateFormula } from './formulaEval';
import { evaluateBooleanExpression } from './gateEval';
import {
  resolveNextStepId,
  getDerivedCalcOutputField,
  type EngineState,
} from './stepResolvers';

/** Raw step data as it appears in steps_data JSON (snake_case). */
interface RawStep {
  id: string;
  type: string;
  title: string;
  next_step?: string | null;
  true_next?: string | null;
  false_next?: string | null;
  choices_next?: Record<string, string>;
  rule?: Record<string, unknown>;
  gate?: unknown;
  formula?: string;
  formula_max?: string;
  output_field?: string;
  output_label?: string;
  output_unit?: string;
  inputs?: string[];
  max_iterations?: number;
  counter_field?: string;
  congestion_check?: Record<string, unknown>;
  max_reached_next?: string;
  loop_next?: string;
  duration_hours?: number;
  reassess_fields?: string[];
  [key: string]: unknown;
}

interface RawStepsData {
  steps?: RawStep[];
  entry_gates?: Array<{ expression?: string; level?: string; message?: string; failure_message?: string }>;
  gates?: unknown[];
  [key: string]: unknown;
}

export interface ExecutionState {
  currentStepKey: string;
  history: Array<{
    stepKey: string;
    stepType: string;
    title: string;
    values: AnswerValues;
    answeredAt: string;
  }>;
  values: AnswerValues;
  protocolVersionId: string;
  protocolId: string;
  patientName: string;
  patientId?: string;
  status: 'em_andamento' | 'concluido' | 'abandonado';
  updatedAt: string;
  clientUuid: string;
}

function normalizeStep(raw: RawStep): Step {
  const base: Record<string, unknown> = {
    id: raw.id,
    type: raw.type,
    title: raw.title,
  };

  if (raw.next_step !== undefined) base.nextStep = raw.next_step;
  if (raw.true_next !== undefined) base.trueNext = raw.true_next;
  if (raw.false_next !== undefined) base.falseNext = raw.false_next;
  if (raw.choices_next !== undefined) base.choicesNext = raw.choices_next;
  if (raw.rule !== undefined) base.rule = raw.rule;
  if (raw.gate !== undefined) base.gate = raw.gate;
  if (raw.description !== undefined) base.description = raw.description;
  if (raw.content !== undefined) base.content = raw.content;
  if (raw.formula !== undefined) base.formula = raw.formula;
  if (raw.formula_max !== undefined) base.formulaMax = raw.formula_max;
  if (raw.output_field !== undefined) base.outputField = raw.output_field;
  if (raw.output_label !== undefined) base.outputLabel = raw.output_label;
  if (raw.output_unit !== undefined) base.outputUnit = raw.output_unit;
  if (raw.inputs !== undefined) base.inputs = raw.inputs;
  if (raw.max_iterations !== undefined) base.maxIterations = raw.max_iterations;
  if (raw.counter_field !== undefined) base.counterField = raw.counter_field;
  if (raw.congestion_check !== undefined) base.congestionCheck = raw.congestion_check;
  if (raw.max_reached_next !== undefined) base.maxReachedNext = raw.max_reached_next;
  if (raw.loop_next !== undefined) base.loopNext = raw.loop_next;
  if (raw.duration_hours !== undefined) base.durationHours = raw.duration_hours;
  if (raw.reassess_fields !== undefined) base.reassessFields = raw.reassess_fields;
  if (raw.min_value !== undefined) base.minValue = raw.min_value;
  if (raw.max_value !== undefined) base.maxValue = raw.max_value;
  if (raw.field_name !== undefined) base.fieldName = raw.field_name;
  if (raw.validation_message !== undefined) base.validationMessage = raw.validation_message;

  if (raw.items !== undefined) base.items = raw.items;
  if (raw.options !== undefined) base.options = raw.options;
  if (raw.medications !== undefined) base.medications = raw.medications;
  if (raw.phases !== undefined) base.phases = raw.phases;
  if (raw.unit !== undefined) base.unit = raw.unit;
  if (raw.notes !== undefined) base.notes = raw.notes;

  return base as unknown as Step;
}

export class GuidedProtocolInterpreter {
  private stepsData: RawStepsData;
  private orderedSteps: RawStep[];
  private stepsById: Map<string, RawStep>;
  private normalizedStepsById: Map<string, Step>;

  constructor(stepsData: Record<string, unknown> | null | undefined) {
    this.stepsData = (stepsData ?? {}) as RawStepsData;
    this.orderedSteps = this.stepsData.steps ?? [];
    this.stepsById = new Map();
    this.normalizedStepsById = new Map();

    for (const step of this.orderedSteps) {
      if (step.id) {
        this.stepsById.set(step.id, step);
        this.normalizedStepsById.set(step.id, normalizeStep(step));
      }
    }
  }

  getStep(stepId: string): Step | undefined {
    return this.normalizedStepsById.get(stepId);
  }

  getFirstStepId(): string | undefined {
    if (this.orderedSteps.length === 0) return undefined;
    return this.orderedSteps[0]!.id;
  }

  resolveNextStepId(
    currentStepId: string,
    values: AnswerValues,
    state?: EngineState,
  ): { nextStepId: string | null; state: EngineState } {
    const step = this.getStep(currentStepId);
    if (!step) return { nextStepId: null, state: state ?? { loopCount: 0 } };

    return resolveNextStepId(step, values, state ?? { loopCount: 0 });
  }

  evaluateFormula(formula: string, context: Record<string, unknown>): string {
    return evaluateFormula(formula, context);
  }
  
  applyDerivedCalculation(
    stepId: string,
    values: AnswerValues,
    context?: Record<string, unknown>,
  ): AnswerValues {
    const step = this.getStep(stepId);
    if (!step || step.type !== 'derived_calc') return values;

    const formula = step.formula;
    if (!formula) return values;

    const calcContext: Record<string, unknown> = {
      ...(context ?? {}),
      ...values,
    };

    const outputField = getDerivedCalcOutputField(step);
    const result = this.evaluateFormula(formula, calcContext);

    return {
      ...values,
      [outputField]: result,
    };
  }
  
  buildContext(
    history?: Array<{ values: AnswerValues }>,
    currentValues?: AnswerValues,
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {};

    for (const entry of history ?? []) {
      Object.assign(context, entry.values);
    }

    if (currentValues) {
      Object.assign(context, currentValues);
    }

    return context;
  }

  evaluateGate(
    gate: { expression?: string; level?: string; message?: string; failure_message?: string },
    context: Record<string, unknown>,
  ): GateWarning | null {
    const expression = gate.expression ?? '';
    const level = (gate.level ?? 'warning') as GateWarning['level'];
    const message = gate.message ?? gate.failure_message ?? '';

    if (!expression) return null;

    try {
      const result = evaluateBooleanExpression(expression, context);
      if (result) return null; // Gate passed
      return {
        passed: false,
        level,
        message,
        expression,
      };
    } catch {
      return {
        passed: false,
        level: 'warning',
        message: `Nao foi possivel avaliar gate: ${message}`,
        expression,
      };
    }
  }

  evaluateStepGates(
    stepId: string,
    context: Record<string, unknown>,
  ): GateWarning[] {
    const step = this.getStep(stepId);
    if (!step) return [];

    const gate = step.gate;
    if (!gate) return [];

    // Support single gate or array of gates
    const gates = Array.isArray(gate) ? gate : [gate];
    const warnings: GateWarning[] = [];

    for (const g of gates) {
      const result = this.evaluateGate(
        g as { expression?: string; level?: string; message?: string; failure_message?: string },
        context,
      );
      if (result) warnings.push(result);
    }

    return warnings;
  }

  evaluateEntryGates(context: Record<string, unknown>): GateWarning[] {
    const entryGates = this.stepsData.entry_gates ?? [];
    const warnings: GateWarning[] = [];

    for (const gate of entryGates) {
      const result = this.evaluateGate(gate, context);
      if (result) warnings.push(result);
    }

    return warnings;
  }

  getStepsData(): RawStepsData {
    return this.stepsData;
  }

  getStepIds(): string[] {
    return this.orderedSteps.map((s) => s.id);
  }
}

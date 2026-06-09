import type { AnswerValues, Step, StepType } from '@/features/guidedProtocol/types';

export interface EngineState {
  loopCount: number;
}

export interface StepResolution {
  nextStepId: string | null;
  state: EngineState;
}

export const ANSWERABLE_TYPES: ReadonlySet<StepType> = new Set<StepType>([
  'yes_no',
  'checklist',
  'multiple_choice',
  'numeric_input',
  'titration_loop',
]);

export const DISPLAY_ONLY_TYPES: ReadonlySet<StepType> = new Set<StepType>([
  'info',
  'derived_calc',
  'medication_prescription',
  'wait_reassess',
]);

export function isAnswerable(step: Step): boolean {
  return ANSWERABLE_TYPES.has(step.type);
}

export function isDisplayOnly(step: Step): boolean {
  return DISPLAY_ONLY_TYPES.has(step.type);
}

export function resolveNextStepId(
  step: Step,
  values: AnswerValues,
  state: EngineState,
): StepResolution {
  const defaultState: EngineState = { ...state };

  switch (step.type) {
    case 'yes_no':
      return resolveYesNo(step, values, defaultState);

    case 'checklist':
      return resolveChecklist(step, values, defaultState);

    case 'titration_loop':
      return resolveTitrationLoop(step, values, defaultState);

    case 'multiple_choice':
      return resolveMultipleChoice(step, values, defaultState);

    case 'info':
    case 'numeric_input':
    case 'derived_calc':
    case 'medication_prescription':
    case 'wait_reassess':
      return { nextStepId: step.nextStep ?? null, state: defaultState };

    default:
      return { nextStepId: null, state: defaultState };
  }
}

function resolveYesNo(
  step: Extract<Step, { type: 'yes_no' }>,
  values: AnswerValues,
  state: EngineState,
): StepResolution {
  const answer = values.answer;
  if (answer === true) {
    return {
      nextStepId: step.trueNext ?? step.rule?.trueNext ?? null,
      state,
    };
  }
  return {
    nextStepId: step.falseNext ?? step.rule?.falseNext ?? null,
    state,
  };
}

function resolveChecklist(
  step: Extract<Step, { type: 'checklist' }>,
  values: AnswerValues,
  state: EngineState,
): StepResolution {
  const rule = step.rule;
  const checkedItems = (values.checked_items ?? values.checkedItems ?? []) as unknown[];
  const minChecked = rule?.minChecked ?? 1;

  if (checkedItems.length >= minChecked) {
    return { nextStepId: rule?.trueNext ?? null, state };
  }
  return { nextStepId: rule?.falseNext ?? null, state };
}

function resolveTitrationLoop(
  step: Extract<Step, { type: 'titration_loop' }>,
  values: AnswerValues,
  state: EngineState,
): StepResolution {
  const loopCount = state.loopCount + 1;
  const newState: EngineState = { ...state, loopCount };
  const maxIterations = step.maxIterations ?? 1;
  const congestionCheck = step.congestionCheck;

  // Congestion check
  if (values.congestion === true && congestionCheck?.trueNext) {
    return { nextStepId: congestionCheck.trueNext, state: newState };
  }

  // Max iterations reached
  if (loopCount >= maxIterations) {
    return { nextStepId: step.maxReachedNext ?? null, state: newState };
  }

  // Continue loop
  return {
    nextStepId: congestionCheck?.falseNext ?? step.loopNext ?? null,
    state: newState,
  };
}

function resolveMultipleChoice(
  step: Extract<Step, { type: 'multiple_choice' }>,
  values: AnswerValues,
  state: EngineState,
): StepResolution {
  const choice = values.choice as string | undefined;
  const choicesNext = step.choicesNext;
  if (choice && choicesNext?.[choice]) {
    return { nextStepId: choicesNext[choice]!, state };
  }
  return { nextStepId: step.nextStep ?? null, state };
}

export function buildDerivedCalcValues(
  _step: Extract<Step, { type: 'derived_calc' }>,
  context: Record<string, unknown>,
): AnswerValues {
  return { ...context };
}

export function getDerivedCalcOutputField(
  step: Extract<Step, { type: 'derived_calc' }>,
): string {
  return ((step as unknown as Record<string, unknown>).output_field as string)
    ?? step.outputLabel
    ?? 'result';
}

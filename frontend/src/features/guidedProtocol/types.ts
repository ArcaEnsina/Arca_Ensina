export type StepType =
  | 'info'
  | 'yes_no'
  | 'multiple_choice'
  | 'checklist'
  | 'numeric_input'
  | 'derived_calc'
  | 'medication_prescription'
  | 'wait_reassess'
  | 'titration_loop';

export type ExecutionStatus = 'em_andamento' | 'concluido' | 'abandonado';

export interface GateWarning {
  passed: boolean;
  level: 'info' | 'warning' | 'critical';
  message: string;
  expression: string;
}

interface BaseStep {
  id: string;
  title: string;
  description?: string;
  content?: string;
  nextStep?: string | null;
  gate?: unknown;
}

export interface InfoStepData extends BaseStep {
  type: 'info';
}

export interface YesNoStepData extends BaseStep {
  type: 'yes_no';
  trueNext?: string;
  falseNext?: string;
  rule?: { trueNext?: string; falseNext?: string };
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface MultipleChoiceStepData extends BaseStep {
  type: 'multiple_choice';
  options: ChoiceOption[];
  choicesNext?: Record<string, string>;
}

export interface ChecklistStepData extends BaseStep {
  type: 'checklist';
  items: ChoiceOption[];
  rule?: { minChecked?: number; trueNext?: string; falseNext?: string };
}

export interface NumericInputStepData extends BaseStep {
  type: 'numeric_input';
  fieldName: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  validationMessage?: string;
}

export interface DerivedCalcStepData extends BaseStep {
  type: 'derived_calc';
  inputs?: string[];
  formula: string;
  formulaMax?: string;
  outputLabel?: string;
  outputUnit?: string;
  notes?: string;
}

export interface Medication {
  name?: string;
  dose?: string;
  route?: string;
  preparation?: string;
  volume?: string;
  notes?: string;
  doseInicial?: string;
  doseMax?: string;
  frequency?: string;
  indication?: string;
}

export interface MedicationPrescriptionStepData extends BaseStep {
  type: 'medication_prescription';
  medications: Medication[];
}

export interface ReassessPhase {
  phase: string;
  monitoring: string;
}

export interface WaitReassessStepData extends BaseStep {
  type: 'wait_reassess';
  durationHours?: number;
  reassessFields?: string[];
  phases?: ReassessPhase[];
}

export interface CongestionCheck {
  title?: string;
  description?: string;
  trueNext?: string;
  falseNext?: string;
}

export interface TitrationLoopStepData extends BaseStep {
  type: 'titration_loop';
  maxIterations?: number;
  counterField?: string;
  congestionCheck?: CongestionCheck;
  maxReachedNext?: string;
  loopNext?: string;
}

export type Step =
  | InfoStepData
  | YesNoStepData
  | MultipleChoiceStepData
  | ChecklistStepData
  | NumericInputStepData
  | DerivedCalcStepData
  | MedicationPrescriptionStepData
  | WaitReassessStepData
  | TitrationLoopStepData;

/** Step types that are submitted via POST execute/answer/. */
export const ANSWERABLE_STEP_TYPES: ReadonlySet<StepType> = new Set<StepType>([
  'yes_no',
  'checklist',
  'multiple_choice',
  'numeric_input',
  'titration_loop',
]);

export function isAnswerableStep(step: Step): boolean {
  return ANSWERABLE_STEP_TYPES.has(step.type);
}

/** Values submitted to execute/answer/ (deep-snake-cased by the transport layer). */
export type AnswerValues = Record<string, unknown>;

/** Full execution returned by POST execute/ and POST execute/answer/. */
export interface Execution {
  id: number;
  version?: number;
  physician?: number;
  patient?: number | null;
  patientName: string;
  clientUuid?: string | null;
  status: ExecutionStatus;
  currentStepKey?: string | null;
  currentStepData?: Step | null;
  gateWarnings: GateWarning[];
  startedAt?: string;
  finishedAt?: string | null;
}

/** Returned by GET execute/step/ and POST execute/next/. */
export interface StepResponse {
  step: Step | null;
  gateWarnings: GateWarning[];
  status?: ExecutionStatus;
}

export interface Reminder {
  stepId: string;
  stepTitle: string;
  answeredAt: string;
  dueAt: string | null;
  status: 'pending' | 'overdue' | 'info';
  durationHours: number;
  reassessFields: string[];
  phases: ReassessPhase[];
}

/** Lightweight protocol shape from the list endpoint (picker). */
export interface GuidedProtocol {
  id: number;
  title: string;
  cid?: string | null;
  specialty?: string | null;
  author?: string | null;
  tags?: string[];
  currentVersionType?: string | null;
}

/** An answered step recorded for the decision timeline. */
export interface HistoryEntry {
  stepKey: string;
  stepType: StepType;
  title: string;
  values: AnswerValues;
  answeredAt: string;
}

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AnswerValues,
  GateWarning,
  Reminder,
  Step,
} from '../types';
import { InfoStep } from './steps/InfoStep';
import { YesNoStep } from './steps/YesNoStep';
import { MultipleChoiceStep } from './steps/MultipleChoiceStep';
import { ChecklistStep } from './steps/ChecklistStep';
import { NumericInputStep } from './steps/NumericInputStep';
import { DerivedCalcStep } from './steps/DerivedCalcStep';
import { MedicationPrescriptionStep } from './steps/MedicationPrescriptionStep';
import { WaitReassessStep } from './steps/WaitReassessStep';
import { TitrationLoopStep } from './steps/TitrationLoopStep';

interface StepRendererProps {
  step: Step;
  gateWarnings: GateWarning[];
  reminders: Reminder[];
  currentIteration: number;
  submitting: boolean;
  onAnswer: (values: AnswerValues) => void;
  onAdvance: () => void;
}

function GateWarnings({ warnings }: { warnings: GateWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {warnings.map((w, idx) => (
        <div
          key={`${w.expression}-${idx}`}
          role="alert"
          className={cn(
            'flex items-start gap-2 rounded-2xl border-2 p-3 text-body-sm',
            w.level === 'critical'
              ? 'border-red-300 bg-red-50 text-red-800'
              : w.level === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900',
          )}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}

export function StepRenderer({
  step,
  gateWarnings,
  reminders,
  currentIteration,
  submitting,
  onAnswer,
  onAdvance,
}: StepRendererProps) {
  function renderStep() {
    switch (step.type) {
      case 'info':
        return <InfoStep step={step} onAdvance={onAdvance} submitting={submitting} />;
      case 'yes_no':
        return <YesNoStep step={step} onAnswer={onAnswer} submitting={submitting} />;
      case 'multiple_choice':
        return (
          <MultipleChoiceStep step={step} onAnswer={onAnswer} submitting={submitting} />
        );
      case 'checklist':
        return (
          <ChecklistStep step={step} onAnswer={onAnswer} submitting={submitting} />
        );
      case 'numeric_input':
        return (
          <NumericInputStep step={step} onAnswer={onAnswer} submitting={submitting} />
        );
      case 'derived_calc':
        return (
          <DerivedCalcStep step={step} onAdvance={onAdvance} submitting={submitting} />
        );
      case 'medication_prescription':
        return (
          <MedicationPrescriptionStep
            step={step}
            onAdvance={onAdvance}
            submitting={submitting}
          />
        );
      case 'wait_reassess':
        return (
          <WaitReassessStep
            step={step}
            reminders={reminders}
            onAdvance={onAdvance}
            submitting={submitting}
          />
        );
      case 'titration_loop':
        return (
          <TitrationLoopStep
            step={step}
            currentIteration={currentIteration}
            onAnswer={onAnswer}
            submitting={submitting}
          />
        );
      default: {
        // Exhaustiveness guard — a new step type must be handled above.
        const _exhaustive: never = step;
        return _exhaustive;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GateWarnings warnings={gateWarnings} />
      {renderStep()}
    </div>
  );
}

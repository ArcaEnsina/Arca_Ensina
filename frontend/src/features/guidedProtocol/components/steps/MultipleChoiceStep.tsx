import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeading } from '../StepHeading';
import type { MultipleChoiceStepData } from '../../types';

interface MultipleChoiceStepProps {
  step: MultipleChoiceStepData;
  onAnswer: (values: { choice: string }) => void;
  submitting: boolean;
}

export function MultipleChoiceStep({
  step,
  onAnswer,
  submitting,
}: MultipleChoiceStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <StepHeading title={step.title} description={step.description} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3" role="group" aria-label={step.title}>
        {step.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={submitting}
            onClick={() => onAnswer({ choice: option.id })}
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl border-2 border-arca-blue-200 bg-card p-4 text-left text-body-lg font-medium text-arca-blue-900 transition-colors',
              'hover:border-arca-blue-600 hover:bg-arca-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-arca-blue-200 disabled:opacity-50',
            )}
          >
            <span>{option.label}</span>
            <ArrowRight className="size-5 shrink-0 text-arca-blue-700" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

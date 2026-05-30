import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-display-sm text-blue-900">{step.title}</h2>
          {step.description && (
            <p className="text-body-md whitespace-pre-line text-muted-foreground">
              {step.description}
            </p>
          )}
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
              'flex items-center justify-between gap-3 rounded-2xl border-2 border-blue-200 bg-white p-4 text-left font-medium text-blue-900 transition-colors',
              'hover:border-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-50',
            )}
          >
            <span>{option.label}</span>
            <ArrowRight className="size-5 shrink-0 text-blue-700" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

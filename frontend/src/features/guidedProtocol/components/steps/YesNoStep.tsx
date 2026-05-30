import { Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { YesNoStepData } from '../../types';

interface YesNoStepProps {
  step: YesNoStepData;
  onAnswer: (values: { answer: boolean }) => void;
  submitting: boolean;
}

export function YesNoStep({ step, onAnswer, submitting }: YesNoStepProps) {
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

      <div className="grid grid-cols-2 gap-3" role="group" aria-label={step.title}>
        <button
          type="button"
          disabled={submitting}
          onClick={() => onAnswer({ answer: true })}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 p-6 font-semibold text-green-700 transition-colors',
            'hover:bg-green-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 disabled:opacity-50',
          )}
        >
          <Check className="size-7" aria-hidden="true" />
          Sim
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => onAnswer({ answer: false })}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-6 font-semibold text-red-700 transition-colors',
            'hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:opacity-50',
          )}
        >
          <X className="size-7" aria-hidden="true" />
          Não
        </button>
      </div>
    </div>
  );
}

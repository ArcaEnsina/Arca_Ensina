import { Check, RotateCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TitrationLoopStepData } from '../../types';

interface TitrationLoopStepProps {
  step: TitrationLoopStepData;
  currentIteration: number;
  onAnswer: (values: { congestion: boolean }) => void;
  submitting: boolean;
}

export function TitrationLoopStep({
  step,
  currentIteration,
  onAnswer,
  submitting,
}: TitrationLoopStepProps) {
  const congestion = step.congestionCheck;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-display-sm text-blue-900">{step.title}</h2>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-body-sm font-semibold text-blue-800">
              <RotateCw className="size-4" aria-hidden="true" />
              {currentIteration}
              {step.maxIterations ? ` / ${step.maxIterations}` : ''}
            </span>
          </div>
          {step.description && (
            <p className="text-body-md whitespace-pre-line text-muted-foreground">
              {step.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-display-sm text-blue-900">
              {congestion?.title ?? 'Sinais de congestão?'}
            </h3>
            {congestion?.description && (
              <p className="text-body-md whitespace-pre-line text-muted-foreground">
                {congestion.description}
              </p>
            )}
          </div>

          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-label={congestion?.title ?? 'Sinais de congestão?'}
          >
            <button
              type="button"
              disabled={submitting}
              onClick={() => onAnswer({ congestion: true })}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-6 font-semibold text-red-700 transition-colors',
                'hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:opacity-50',
              )}
            >
              <Check className="size-7" aria-hidden="true" />
              Sim
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onAnswer({ congestion: false })}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-green-200 bg-green-50 p-6 font-semibold text-green-700 transition-colors',
                'hover:bg-green-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 disabled:opacity-50',
              )}
            >
              <X className="size-7" aria-hidden="true" />
              Não
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

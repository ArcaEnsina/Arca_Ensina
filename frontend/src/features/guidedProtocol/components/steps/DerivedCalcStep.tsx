import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGuidedProtocolStore } from '../../store';
import { evalFormula, formatNumber } from '../../engine/formula';
import type { DerivedCalcStepData } from '../../types';

interface DerivedCalcStepProps {
  step: DerivedCalcStepData;
  onAdvance: () => void;
  submitting: boolean;
}

export function DerivedCalcStep({
  step,
  onAdvance,
  submitting,
}: DerivedCalcStepProps) {
  const history = useGuidedProtocolStore((s) => s.history);

  // Build the evaluation context from every answered value so far.
  const context = useMemo(() => {
    const ctx: Record<string, unknown> = {};
    for (const entry of history) Object.assign(ctx, entry.values);
    return ctx;
  }, [history]);

  const result = useMemo(
    () => evalFormula(step.formula, context),
    [step.formula, context],
  );
  const max = useMemo(
    () => (step.formulaMax ? evalFormula(step.formulaMax, context) : null),
    [step.formulaMax, context],
  );
  const clamped = result != null && max != null ? Math.min(result, max) : result;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-display-sm text-blue-900">{step.title}</h2>
            {step.description && (
              <p className="text-body-md whitespace-pre-line text-muted-foreground">
                {step.description}
              </p>
            )}
          </div>

          <div
            className="flex flex-col items-center gap-1 rounded-2xl bg-blue-50 py-8"
            aria-live="polite"
          >
            {step.outputLabel && (
              <span className="text-body-sm font-medium uppercase tracking-wide text-blue-700">
                {step.outputLabel}
              </span>
            )}
            <span className="text-numeric-hero text-blue-900">
              {clamped != null ? formatNumber(clamped) : '—'}
              {step.outputUnit && (
                <span className="text-display-sm ml-2 text-blue-700">
                  {step.outputUnit}
                </span>
              )}
            </span>
            {max != null && result != null && result !== clamped && (
              <span className="text-body-sm text-red-700" role="alert">
                Limitado ao máximo de {formatNumber(max)} {step.outputUnit}
              </span>
            )}
          </div>

          {step.notes && (
            <p className="text-body-sm whitespace-pre-line text-muted-foreground">
              {step.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        size="xl"
        className="w-full gap-2 rounded-2xl"
        onClick={onAdvance}
        disabled={submitting}
      >
        Continuar
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}

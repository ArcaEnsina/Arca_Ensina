import { useMemo } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { InfoBanner } from '../InfoBanner';
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
  const wasClamped = max != null && result != null && result !== clamped;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5">
          <StepHeading title={step.title} description={step.description} />

          {/* Dominant result card — mirrors the calculator's hero treatment. */}
          <div
            className="flex flex-col gap-1 rounded-3xl bg-arca-blue-600 p-6 text-white"
            aria-live="polite"
          >
            {step.outputLabel && (
              <span className="text-caption font-medium uppercase tracking-wider text-white/70">
                {step.outputLabel}
              </span>
            )}
            <span className="text-numeric-hero font-bold leading-none">
              {clamped != null ? formatNumber(clamped) : '—'}
              {step.outputUnit && (
                <span className="text-numeric-md ml-2 font-semibold text-white/80">
                  {step.outputUnit}
                </span>
              )}
            </span>
            {wasClamped && (
              <span
                className="mt-1 flex items-center gap-1.5 text-body-sm font-medium text-white/90"
                role="alert"
              >
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Limitado ao máximo de {formatNumber(max!)} {step.outputUnit}
              </span>
            )}
          </div>

          {step.notes && <InfoBanner>{step.notes}</InfoBanner>}
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

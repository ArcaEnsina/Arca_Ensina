import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePatientStore } from '@/features/patient/store';
import { StepHeading } from '../StepHeading';
import type { AnswerValues, NumericInputStepData } from '../../types';

interface NumericInputStepProps {
  step: NumericInputStepData;
  onAnswer: (values: AnswerValues) => void;
  submitting: boolean;
}

export function NumericInputStep({
  step,
  onAnswer,
  submitting,
}: NumericInputStepProps) {
  const activePatient = usePatientStore((s) => s.activePatient);
  const isWeightField = step.fieldName.toLowerCase().includes('peso');
  const [value, setValue] = useState<string>(
    isWeightField && activePatient?.peso ? activePatient.peso : '',
  );

  const numeric = Number(value);
  const outOfRange =
    value !== '' &&
    ((step.minValue != null && numeric < step.minValue) ||
      (step.maxValue != null && numeric > step.maxValue));
  const canSubmit = value !== '' && !Number.isNaN(numeric);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5">
          <StepHeading title={step.title} description={step.description} />

          <label className="flex flex-col gap-2">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
              Valor {step.unit ? `(${step.unit})` : ''}
            </span>
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border-2 px-4 py-2 transition-colors focus-within:ring-4 focus-within:ring-arca-blue-200',
                outOfRange ? 'border-destructive' : 'border-arca-blue-200 focus-within:border-arca-blue-600',
              )}
            >
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={step.minValue}
                max={step.maxValue}
                aria-invalid={outOfRange}
                className="h-12 border-0 bg-transparent px-0 text-numeric-md font-semibold text-arca-blue-900 shadow-none focus-visible:ring-0"
              />
              {step.unit && (
                <span className="text-numeric-md font-semibold text-arca-blue-700">
                  {step.unit}
                </span>
              )}
            </div>
            {outOfRange && (
              <span className="text-body-sm text-destructive" role="alert">
                {step.validationMessage ?? 'Valor fora do intervalo esperado.'}
              </span>
            )}
          </label>
        </CardContent>
      </Card>

      <Button
        size="xl"
        className="w-full gap-2 rounded-2xl"
        disabled={submitting || !canSubmit}
        onClick={() => onAnswer({ [step.fieldName]: numeric })}
      >
        Continuar
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}

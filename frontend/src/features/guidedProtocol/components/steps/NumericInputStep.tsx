import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePatientStore } from '@/features/patient/store';
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

  // fix3 #4: weight fields prefill from the active patient (still editable).
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
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-display-sm text-blue-900">{step.title}</h2>
            {step.description && (
              <p className="text-body-md whitespace-pre-line text-muted-foreground">
                {step.description}
              </p>
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-body-sm font-medium text-muted-foreground">
              Valor {step.unit ? `(${step.unit})` : ''}
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={step.minValue}
                max={step.maxValue}
                aria-invalid={outOfRange}
                className="text-numeric-md"
              />
              {step.unit && (
                <span className="text-body-md font-semibold text-muted-foreground">
                  {step.unit}
                </span>
              )}
            </div>
            {outOfRange && (
              <span className="text-body-sm text-red-700" role="alert">
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

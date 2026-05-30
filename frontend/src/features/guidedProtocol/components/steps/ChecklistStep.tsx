import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeading } from '../StepHeading';
import type { ChecklistStepData } from '../../types';

interface ChecklistStepProps {
  step: ChecklistStepData;
  onAnswer: (values: { checkedItems: string[] }) => void;
  submitting: boolean;
}

function classificationLabel(title: string): string {
  const match = title.match(/\(([^)]+)\)/);
  return match?.[1] ?? 'Critério atingido';
}

export function ChecklistStep({ step, onAnswer, submitting }: ChecklistStepProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const minChecked = step.rule?.minChecked ?? 1;
  const checkedCount = checked.size;
  const met = checkedCount >= minChecked;
  const label = classificationLabel(step.title);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          <StepHeading title={step.title} description={step.description} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2" role="group" aria-label={step.title}>
        {step.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              onClick={() => toggle(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-arca-blue-200',
                isChecked
                  ? 'border-arca-blue-600 bg-arca-blue-50'
                  : 'border-border bg-card hover:border-arca-blue-300',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  isChecked
                    ? 'border-arca-blue-600 bg-arca-blue-600 text-white'
                    : 'border-neutral-300',
                )}
                aria-hidden="true"
              >
                {isChecked && <Check className="size-4" />}
              </span>
              <span className="text-body-md font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className={cn(
          'flex flex-col items-center gap-0.5 rounded-2xl px-6 py-4 text-center transition-colors',
          met ? 'bg-arca-blue-100' : 'bg-muted',
        )}
      >
        <span className="text-caption font-semibold uppercase tracking-wider text-arca-blue-800/70">
          Classificação atual
        </span>
        <span
          className={cn(
            'text-display-sm',
            met ? 'text-arca-blue-900' : 'text-muted-foreground',
          )}
        >
          {met ? label : '—'}
        </span>
        <span className="text-caption text-arca-blue-800/60">
          {checkedCount} de {step.items.length} sinais marcados
        </span>
      </div>

      <Button
        size="xl"
        className="w-full gap-2 rounded-2xl"
        disabled={submitting}
        onClick={() => onAnswer({ checkedItems: Array.from(checked) })}
      >
        Confirmar
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}

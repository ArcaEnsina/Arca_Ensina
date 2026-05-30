import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ChecklistStepData } from '../../types';

interface ChecklistStepProps {
  step: ChecklistStepData;
  onAnswer: (values: { checkedItems: string[] }) => void;
  submitting: boolean;
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
                'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200',
                isChecked
                  ? 'border-blue-700 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
                  isChecked
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-gray-300',
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

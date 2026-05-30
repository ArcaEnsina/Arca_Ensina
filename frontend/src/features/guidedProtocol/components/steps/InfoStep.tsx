import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { InfoStepData } from '../../types';

interface InfoStepProps {
  step: InfoStepData;
  onAdvance: () => void;
  submitting: boolean;
}

export function InfoStep({ step, onAdvance, submitting }: InfoStepProps) {
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
          {step.content && (
            <p className="text-body-md whitespace-pre-line">{step.content}</p>
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

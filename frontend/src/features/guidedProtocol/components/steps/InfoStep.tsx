import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { InfoBanner } from '../InfoBanner';
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
        <CardContent className="flex flex-col gap-4">
          <StepHeading title={step.title} description={step.description} />
          {step.content && <InfoBanner>{step.content}</InfoBanner>}
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

import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { BinaryChoice } from '../BinaryChoice';
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
        <CardContent>
          <StepHeading title={step.title} description={step.description} />
        </CardContent>
      </Card>

      <BinaryChoice
        label={step.title}
        disabled={submitting}
        onChoose={(answer) => onAnswer({ answer })}
      />
    </div>
  );
}

import { RotateCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { BinaryChoice } from '../BinaryChoice';
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
          <div className="flex items-start justify-between gap-3">
            <StepHeading title={step.title} description={step.description} />
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-arca-blue-100 px-3 py-1 text-body-sm font-semibold text-arca-blue-800">
              <RotateCw className="size-4" aria-hidden="true" />
              {currentIteration}
              {step.maxIterations ? ` / ${step.maxIterations}` : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <StepHeading
            title={congestion?.title ?? 'Sinais de congestão?'}
            description={congestion?.description}
          />
          <BinaryChoice
            label={congestion?.title ?? 'Sinais de congestão?'}
            disabled={submitting}
            onChoose={(congestionValue) => onAnswer({ congestion: congestionValue })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

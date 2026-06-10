import { useState } from 'react';
import { RotateCw, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { BinaryChoice } from '../BinaryChoice';
import type { AnswerValues, TitrationLoopStepData } from '../../types';

interface TitrationLoopStepProps {
  step: TitrationLoopStepData;
  currentIteration: number;
  onAnswer: (values: AnswerValues) => void;
  submitting: boolean;
}

export function TitrationLoopStep({
  step,
  currentIteration,
  onAnswer,
  submitting,
}: TitrationLoopStepProps) {
  const congestion = step.congestionCheck;
  const continueLabel = step.choice?.continueLabel ?? 'Iniciar outro bolus';
  const stopLabel = step.choice?.stopLabel ?? 'Esperar HCT';

  // Two-stage flow: congestion is a safety gate; only when absent do we offer
  // the explicit "start another / wait" decision.
  const [noCongestion, setNoCongestion] = useState(false);

  function handleCongestion(value: boolean) {
    if (value) {
      // Congestion present → safety stop, decision is irrelevant.
      onAnswer({ congestion: true });
      return;
    }
    setNoCongestion(true);
  }

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

      {!noCongestion ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <StepHeading
              title={congestion?.title ?? 'Sinais de congestão?'}
              description={congestion?.description}
            />
            <BinaryChoice
              label={congestion?.title ?? 'Sinais de congestão?'}
              disabled={submitting}
              onChoose={handleCongestion}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <StepHeading
              title="Conduta"
              description="Sem sinais de congestão. Iniciar novo bolus ou aguardar o resultado do HCT?"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                size="xl"
                className="gap-2 rounded-2xl"
                disabled={submitting}
                onClick={() =>
                  onAnswer({ congestion: false, decision: 'iniciar_outro' })
                }
              >
                <RotateCw className="size-5" aria-hidden="true" />
                {continueLabel}
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="gap-2 rounded-2xl"
                disabled={submitting}
                onClick={() =>
                  onAnswer({ congestion: false, decision: 'esperar_hct' })
                }
              >
                <Hourglass className="size-5" aria-hidden="true" />
                {stopLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaperSchedule } from '../types';

interface TaperingStepProps {
  schedule: TaperSchedule;
  onBack: () => void;
  onNext: () => void;
}

export function TaperingStep({ schedule, onBack, onNext }: TaperingStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Desmame</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Protocolo de redução gradual
        </p>
      </div>

      <div className="space-y-3">
        {schedule.steps.map((step, index) => (
          <div
            key={index}
            className="rounded-4xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {step.day}
                </span>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {step.action}
                </p>
                {step.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white/95 py-4 backdrop-blur-sm">
        <Button variant="ghost" size="lg" onClick={onBack} className="gap-1">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button size="lg" onClick={onNext} className="gap-1">
          Ver revisão
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

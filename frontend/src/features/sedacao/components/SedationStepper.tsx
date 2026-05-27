import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SedationPhase } from '../types';

const STEPS: { phase: SedationPhase; label: string }[] = [
  { phase: 'select', label: 'Seleção' },
  { phase: 'convert', label: 'Conversão' },
  { phase: 'taper', label: 'Desmame' },
  { phase: 'review', label: 'Revisão' },
];

const phaseOrder: SedationPhase[] = ['select', 'convert', 'taper', 'review'];

interface SedationStepperProps {
  currentPhase: SedationPhase;
}

export function SedationStepper({ currentPhase }: SedationStepperProps) {
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <nav aria-label="Progresso do painel de sedação">
      <ol
        className="flex items-center justify-center gap-2 overflow-x-auto pb-2 md:gap-4"
      >
        {STEPS.map((step, index) => {
          const isActive = step.phase === currentPhase;
          const isCompleted = index < currentIndex;

          return (
            <li
              key={step.phase}
              className="flex items-center gap-2 md:gap-4"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-blue-700 text-white',
                    isActive && 'bg-blue-700 text-white',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap text-sm font-medium',
                    isActive && 'text-blue-700',
                    isCompleted && 'text-blue-700',
                    !isActive && !isCompleted && 'text-gray-500',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'hidden h-px w-8 md:block',
                    isCompleted ? 'bg-blue-700' : 'bg-gray-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

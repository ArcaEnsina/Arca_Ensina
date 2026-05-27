import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SedationPhase } from '../types';

const STEPS: { phase: SedationPhase; label: string }[] = [
  { phase: 'select', label: 'Seleção' },
  { phase: 'convert', label: 'Cálculo' },
  { phase: 'taper', label: 'Desmame' },
  { phase: 'review', label: 'Revisão' },
];

const phaseOrder: SedationPhase[] = ['select', 'convert', 'taper', 'review'];

interface StepIndicatorProps {
  currentPhase: SedationPhase;
}

export function StepIndicator({ currentPhase }: StepIndicatorProps) {
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <nav aria-label="Progresso do painel de sedação">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = step.phase === currentPhase;
          const isCompleted = index < currentIndex;

          return (
            <li
              key={step.phase}
              className="flex flex-1 items-center"
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 motion-reduce:transition-none',
                    isCompleted && 'bg-blue-700 text-white',
                    isActive && 'bg-blue-700 text-white ring-4 ring-blue-100',
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
                    'whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider',
                    isActive && 'text-blue-700',
                    isCompleted && 'text-blue-700',
                    !isActive && !isCompleted && 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none',
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

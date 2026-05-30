import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtocolStepperProps {
  /** Number of steps already answered/advanced in this session. */
  completedCount: number;
}

/** Maximum number of completed dots rendered before older ones collapse. */
const MAX_DONE_DOTS = 5;

function Connector({ filled }: { filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'h-0.5 min-w-2 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none',
        filled ? 'bg-arca-blue-600' : 'bg-neutral-200',
      )}
    />
  );
}

export function ProtocolStepper({ completedCount }: ProtocolStepperProps) {
  const hiddenDone = Math.max(0, completedCount - MAX_DONE_DOTS);
  const visibleDone = Math.min(completedCount, MAX_DONE_DOTS);
  const currentNumber = completedCount + 1;

  return (
    <nav aria-label="Progresso do protocolo" className="flex flex-col items-center gap-2">
      <p className="text-caption font-bold tracking-wide text-arca-blue-700">
        Etapa {currentNumber}
      </p>
      <ol className="flex w-full items-center">
        {hiddenDone > 0 && (
          <>
            <li className="flex shrink-0 items-center">
              <span
                className="flex h-7 items-center gap-1 rounded-full bg-arca-blue-600 px-2.5 text-xs font-bold text-white"
                aria-label={`${hiddenDone} etapas anteriores concluídas`}
              >
                <Check className="size-3" aria-hidden="true" />
                {completedCount}
              </span>
            </li>
            <Connector filled />
          </>
        )}

        {Array.from({ length: visibleDone }).map((_, idx) => (
          <li key={`done-${idx}`} className="flex flex-1 items-center">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-arca-blue-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <Check className="size-4" />
            </span>
            <Connector filled />
          </li>
        ))}

        {/* Current step */}
        <li className="flex shrink-0 items-center" aria-current="step">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-arca-blue-700 text-sm font-bold text-white ring-4 ring-arca-blue-100">
            {currentNumber}
          </span>
        </li>

        {/* Trailing "more ahead" hint */}
        <Connector />
        <li className="flex shrink-0 items-center">
          <span
            className="size-7 rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50"
            aria-hidden="true"
          />
        </li>
      </ol>
    </nav>
  );
}

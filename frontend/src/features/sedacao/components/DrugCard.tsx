import { cn } from '@/lib/utils';
import { Check, Brain, Droplets, Activity, Pill, Droplet } from 'lucide-react';
import type { DrugOption } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Droplets,
  Activity,
  Pill,
  Droplet,
};

interface DrugCardProps {
  drug: DrugOption;
  selected?: boolean;
  onClick?: () => void;
  hidden?: boolean;
}

export function DrugCard({ drug, selected = false, onClick, hidden = false }: DrugCardProps) {
  const Icon = ICON_MAP[drug.icon] ?? Pill;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${drug.name} — ${drug.category} · ${drug.route}`}
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      className={cn(
        'flex w-full items-center gap-3 rounded-4xl border-2 p-4 text-left transition-all duration-200 ease-out motion-reduce:transition-none',
        'min-h-[44px] min-w-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2',
        selected
          ? 'border-blue-700 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
        hidden && 'pointer-events-none h-0 overflow-hidden border-0 p-0 opacity-0',
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none',
          selected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold', selected ? 'text-blue-700' : 'text-gray-900')}>
          {drug.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {drug.category}
          {drug.route && ` · ${drug.route}`}
        </p>
      </div>

      <div
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 motion-reduce:transition-none',
          selected
            ? 'border-blue-700 bg-blue-700 text-white'
            : 'border-gray-300 bg-transparent',
        )}
      >
        {selected && <Check className="size-3.5" aria-hidden="true" />}
      </div>
    </button>
  );
}

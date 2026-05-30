import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BinaryChoiceProps {
  label: string;
  onChoose: (value: boolean) => void;
  disabled?: boolean;
  yesLabel?: string;
  noLabel?: string;
}

export function BinaryChoice({
  label,
  onChoose,
  disabled,
  yesLabel = 'Sim',
  noLabel = 'Não',
}: BinaryChoiceProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label={label}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChoose(true)}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl bg-arca-blue-700 p-6 text-lg font-semibold text-white transition-colors',
          'hover:bg-arca-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-arca-blue-200 disabled:opacity-50',
        )}
      >
        <Check className="size-7" aria-hidden="true" />
        {yesLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChoose(false)}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-arca-blue-600 bg-card p-6 text-lg font-semibold text-arca-blue-700 transition-colors',
          'hover:bg-arca-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-arca-blue-200 disabled:opacity-50',
        )}
      >
        <X className="size-7" aria-hidden="true" />
        {noLabel}
      </button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** HH:MM:SS countdown string. Clamps at 00:00:00 once overdue. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

interface ReminderCountdownProps {
  /** ISO timestamp the countdown targets. */
  dueAt: string;
  /** Extra classes; a `text-*` color here wins over the default (via twMerge). */
  className?: string;
  showIcon?: boolean;
}

/**
 * Live countdown to `dueAt`, re-rendering each second. Turns red once overdue.
 * Shared by the in-protocol timer banner and the dashboard "em execução" card.
 */
export function ReminderCountdown({
  dueAt,
  className,
  showIcon = true,
}: ReminderCountdownProps) {
  const target = new Date(dueAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;
  const overdue = remaining <= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 tabular-nums',
        overdue ? 'text-arca-red-700' : 'text-arca-blue-900',
        className,
      )}
      aria-live="polite"
    >
      {showIcon && (
        <Clock
          className={cn('size-4', overdue ? 'text-arca-red-600' : 'text-arca-blue-700')}
          aria-hidden="true"
        />
      )}
      {formatRemaining(remaining)}
    </span>
  );
}

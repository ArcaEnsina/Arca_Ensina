import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReminderCountdown } from './ReminderCountdown';
import { getSoonestReminder } from '../hooks/useActiveExecution';
import type { Reminder } from '../types';

interface ActiveTimerBannerProps {
  reminders: Reminder[];
  /** Id of the step on screen; the banner hides on its own timer step. */
  currentStepId?: string;
}

/**
 * Inline indicator (under the patient card) that a reassessment timer is
 * running, so the clock stays visible on every step — not only the
 * wait_reassess / titration step that owns it. Hidden on that step itself to
 * avoid duplicating the big countdown it already renders.
 */
export function ActiveTimerBanner({
  reminders,
  currentStepId,
}: ActiveTimerBannerProps) {
  const reminder = getSoonestReminder(reminders);
  if (!reminder?.dueAt) return null;
  if (reminder.stepId === currentStepId) return null;

  const overdue = reminder.status === 'overdue';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3',
        overdue
          ? 'border-arca-red-200 bg-arca-red-50'
          : 'border-arca-blue-100 bg-arca-blue-50',
      )}
    >
      <div className="flex items-center gap-2">
        <Clock
          className={cn(
            'size-5 shrink-0',
            overdue ? 'text-arca-red-600' : 'text-arca-blue-700',
          )}
          aria-hidden="true"
        />
        <div className="flex flex-col">
          <span
            className={cn(
              'text-body-sm font-medium',
              overdue ? 'text-arca-red-700' : 'text-arca-blue-900',
            )}
          >
            {overdue ? 'Reavaliação devida' : 'Cronômetro ativo'}
          </span>
          <span className="text-caption text-muted-foreground">
            {reminder.stepTitle}
          </span>
        </div>
      </div>
      <ReminderCountdown
        dueAt={reminder.dueAt}
        showIcon={false}
        className="text-heading-lg font-bold"
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeading } from '../StepHeading';
import type { Reminder, WaitReassessStepData } from '../../types';

interface WaitReassessStepProps {
  step: WaitReassessStepData;
  reminders: Reminder[];
  onAdvance: () => void;
  submitting: boolean;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}min`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function WaitReassessStep({
  step,
  reminders,
  onAdvance,
  submitting,
}: WaitReassessStepProps) {
  // Countdown is driven by the server's due_at, not an ephemeral local timer.
  const reminder = reminders.find((r) => r.stepId === step.id);
  const dueAt = reminder?.dueAt ? new Date(reminder.dueAt).getTime() : null;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (dueAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [dueAt]);

  const remaining = dueAt != null ? dueAt - now : null;
  const overdue = remaining != null && remaining <= 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-5">
          <StepHeading title={step.title} description={step.description} />

          <div
            className={cn(
              'flex flex-col items-center gap-1 rounded-3xl py-7 transition-colors',
              overdue ? 'bg-arca-red-50' : 'bg-arca-blue-50',
            )}
            aria-live="polite"
          >
            <Clock
              className={cn(
                'size-6',
                overdue ? 'text-arca-red-600' : 'text-arca-blue-700',
              )}
              aria-hidden="true"
            />
            {remaining != null ? (
              <>
                <span
                  className={cn(
                    'text-numeric-hero font-bold tabular-nums',
                    overdue ? 'text-arca-red-700' : 'text-arca-blue-900',
                  )}
                >
                  {formatRemaining(remaining)}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {overdue
                    ? 'Reavaliação devida'
                    : `Reavaliar em ${formatDuration(step.durationMinutes ?? 0)}`}
                </span>
              </>
            ) : (
              <span className="text-body-md text-muted-foreground">
                {step.durationMinutes
                  ? `Reavaliar em ${formatDuration(step.durationMinutes)}`
                  : 'Reavaliação contínua'}
              </span>
            )}
          </div>

          {step.reassessFields && step.reassessFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {step.reassessFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-arca-blue-100 px-3 py-1 text-body-sm font-medium text-arca-blue-800"
                >
                  {field}
                </span>
              ))}
            </div>
          )}

          {step.phases && step.phases.length > 0 && (
            <ul className="flex flex-col gap-2">
              {step.phases.map((phase) => (
                <li
                  key={phase.phase}
                  className="rounded-2xl border border-arca-blue-100 bg-arca-blue-50/40 p-3"
                >
                  <p className="text-body-md font-semibold text-arca-blue-900">
                    {phase.phase}
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    {phase.monitoring}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button
        size="xl"
        className="w-full gap-2 rounded-2xl"
        onClick={onAdvance}
        disabled={submitting}
      >
        Continuar
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}

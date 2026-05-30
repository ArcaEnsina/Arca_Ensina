import { useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Reminder, WaitReassessStepData } from '../../types';

interface WaitReassessStepProps {
  step: WaitReassessStepData;
  reminders: Reminder[];
  onAdvance: () => void;
  submitting: boolean;
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
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-display-sm text-blue-900">{step.title}</h2>
            {step.description && (
              <p className="text-body-md whitespace-pre-line text-muted-foreground">
                {step.description}
              </p>
            )}
          </div>

          <div
            className="flex flex-col items-center gap-1 rounded-2xl bg-blue-50 py-6"
            aria-live="polite"
          >
            <Clock className="size-6 text-blue-700" aria-hidden="true" />
            {remaining != null ? (
              <>
                <span className="text-numeric-hero text-blue-900">
                  {formatRemaining(remaining)}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {overdue
                    ? 'Reavaliação devida'
                    : `Reavaliar em ${step.durationHours ?? 0}h`}
                </span>
              </>
            ) : (
              <span className="text-body-md text-muted-foreground">
                {step.durationHours
                  ? `Reavaliar em ${step.durationHours}h`
                  : 'Reavaliação contínua'}
              </span>
            )}
          </div>

          {step.reassessFields && step.reassessFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {step.reassessFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-blue-100 px-3 py-1 text-body-sm font-medium text-blue-800"
                >
                  {field}
                </span>
              ))}
            </div>
          )}

          {step.phases && step.phases.length > 0 && (
            <ul className="flex flex-col gap-2">
              {step.phases.map((phase) => (
                <li key={phase.phase} className="rounded-lg border border-blue-100 p-3">
                  <p className="text-body-md font-semibold text-blue-900">
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

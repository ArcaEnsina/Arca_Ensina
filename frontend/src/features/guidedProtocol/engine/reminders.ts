import type { Reminder, ReassessPhase, Step } from '../types';

/** Step types that carry a timer and therefore produce a Reminder. */
const REMINDER_STEP_TYPES: ReadonlySet<string> = new Set([
  'wait_reassess',
  'titration_loop',
]);

/** Minimal history shape needed to compute reminders (engine-agnostic). */
export interface ReminderHistoryEntry {
  stepKey: string;
  stepType: string;
  title: string;
  answeredAt: string;
}

/** Reads the timer duration (in minutes) of a timed step. */
export function getStepDurationMinutes(step: Step | undefined): number {
  if (!step) return 0;
  if (step.type === 'wait_reassess' || step.type === 'titration_loop') {
    return (step as { durationMinutes?: number }).durationMinutes ?? 0;
  }
  return 0;
}

/**
 * Pure reminder builder shared by the local executor and the foreground
 * scheduler. A step that repeats (e.g. a titration_loop looping back to its
 * timer) appears multiple times in `history` under the same `stepKey`; we keep
 * only the most recent occurrence so the countdown restarts on each new bolus.
 * This mirrors the backend, where ProtocolExecutionState is upserted by
 * (execution, step_key) — one row per step, with the latest answered_at.
 */
export function buildReminders(
  history: ReminderHistoryEntry[],
  getStep: (id: string) => Step | undefined,
  now: number = Date.now(),
): Reminder[] {
  const latestByStep = new Map<string, ReminderHistoryEntry>();
  for (const entry of history) {
    if (!REMINDER_STEP_TYPES.has(entry.stepType)) continue;
    const prev = latestByStep.get(entry.stepKey);
    if (
      !prev ||
      new Date(entry.answeredAt).getTime() >= new Date(prev.answeredAt).getTime()
    ) {
      latestByStep.set(entry.stepKey, entry);
    }
  }

  const reminders: Reminder[] = [];
  for (const entry of latestByStep.values()) {
    const step = getStep(entry.stepKey);
    if (!step || !REMINDER_STEP_TYPES.has(step.type)) continue;

    const durationMinutes = getStepDurationMinutes(step);
    if (durationMinutes <= 0) continue;

    const answeredAt = new Date(entry.answeredAt).getTime();
    const dueAtTime = answeredAt + durationMinutes * 60_000;
    const dueAt = new Date(dueAtTime).toISOString();
    const status: Reminder['status'] = now > dueAtTime ? 'overdue' : 'pending';

    reminders.push({
      stepId: entry.stepKey,
      stepTitle: entry.title,
      answeredAt: entry.answeredAt,
      dueAt,
      status,
      durationMinutes,
      reassessFields: (step as { reassessFields?: string[] }).reassessFields ?? [],
      phases: (step as { phases?: ReassessPhase[] }).phases ?? [],
    });
  }

  return reminders;
}

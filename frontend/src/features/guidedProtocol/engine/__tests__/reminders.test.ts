import { describe, it, expect } from 'vitest';
import { buildReminders, type ReminderHistoryEntry } from '../reminders';
import type { Step } from '../../types';

const STEPS: Record<string, Step> = {
  wait: {
    id: 'wait',
    type: 'wait_reassess',
    title: 'Espera',
    durationMinutes: 20,
    reassessFields: ['hematocrito'],
  } as Step,
  loop: {
    id: 'loop',
    type: 'titration_loop',
    title: 'Bolus',
    durationMinutes: 20,
  } as Step,
  info: { id: 'info', type: 'info', title: 'Sem timer' } as Step,
  notimer: { id: 'notimer', type: 'wait_reassess', title: 'Contínua' } as Step,
};

const getStep = (id: string): Step | undefined => STEPS[id];

function entry(
  stepKey: string,
  stepType: string,
  answeredAt: string,
): ReminderHistoryEntry {
  return { stepKey, stepType, title: STEPS[stepKey]?.title ?? stepKey, answeredAt };
}

describe('buildReminders', () => {
  const now = Date.parse('2026-06-10T12:00:00Z');

  it('builds reminders for wait_reassess and titration_loop in minutes', () => {
    const history = [
      entry('wait', 'wait_reassess', '2026-06-10T11:55:00Z'), // due 12:15 → pending
      entry('loop', 'titration_loop', '2026-06-10T11:30:00Z'), // due 11:50 → overdue
    ];
    const reminders = buildReminders(history, getStep, now);
    const byId = Object.fromEntries(reminders.map((r) => [r.stepId, r]));

    expect(new Set(Object.keys(byId))).toEqual(new Set(['wait', 'loop']));
    expect(byId.wait.durationMinutes).toBe(20);
    expect(byId.wait.status).toBe('pending');
    expect(byId.loop.status).toBe('overdue');
    expect(byId.wait.dueAt).toBe('2026-06-10T12:15:00.000Z');
  });

  it('excludes steps without a timer', () => {
    const history = [
      entry('info', 'info', '2026-06-10T11:59:00Z'),
      entry('notimer', 'wait_reassess', '2026-06-10T11:59:00Z'),
    ];
    expect(buildReminders(history, getStep, now)).toEqual([]);
  });

  it('dedupes repeated step_key to the most recent answeredAt (timer restarts)', () => {
    const history = [
      entry('loop', 'titration_loop', '2026-06-10T10:00:00Z'), // old bolus
      entry('wait', 'wait_reassess', '2026-06-10T10:30:00Z'),
      entry('loop', 'titration_loop', '2026-06-10T11:55:00Z'), // latest bolus
    ];
    const reminders = buildReminders(history, getStep, now);
    const loop = reminders.filter((r) => r.stepId === 'loop');

    expect(loop).toHaveLength(1);
    expect(loop[0]!.answeredAt).toBe('2026-06-10T11:55:00Z');
    expect(loop[0]!.dueAt).toBe('2026-06-10T12:15:00.000Z'); // 11:55 + 20min
    expect(loop[0]!.status).toBe('pending');
  });
});

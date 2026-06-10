import { GuidedProtocolInterpreter } from '@/engines/protocol'
import { buildReminders } from '@/features/guidedProtocol/engine/reminders'
import type { Reminder } from '@/features/guidedProtocol/types'
import { listActiveExecutions } from '@/lib/offline/executionState'
import { getProtocol } from '@/lib/offline/protocolCache'

/**
 * Local (foreground) notification seam.
 *
 * `notify()` is the single place that wraps `new Notification(...)` while the
 * PWA is open. Real background/offline delivery (Service Worker + Push) is
 * handled in the notifications branch and extends/replaces this seam.
 *
 * `startReminderScheduler()` arms timers that fire `notify()` when a protocol
 * reminder (wait_reassess / titration_loop) comes due, even if the user has
 * navigated away from the timer step. dueAt is recomputed from execution
 * history + cached protocol durations via the shared `buildReminders` helper,
 * so it stays in parity with the local executor and the backend.
 */

export interface NotificationPayload {
  title: string
  body?: string
  tag?: string
}

/** Ask for notification permission. Call from a user gesture (e.g. "Iniciar"). */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Single foreground notification seam. No-op without granted permission. */
export function notify(payload: NotificationPayload): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(payload.title, { body: payload.body, tag: payload.tag })
  } catch {
    // Some platforms require a Service Worker for Notifications; swallow here —
    // the Push branch handles SW-based delivery.
  }
}

interface ScheduledReminder {
  clientUuid: string
  reminder: Reminder
}

function reminderKey(clientUuid: string, reminder: Reminder): string {
  return `${clientUuid}:${reminder.stepId}:${reminder.dueAt}`
}

/** Recompute live reminders across all active local executions. */
async function computeActiveReminders(): Promise<ScheduledReminder[]> {
  const executions = await listActiveExecutions()
  const out: ScheduledReminder[] = []

  for (const execution of executions) {
    if (execution.status !== 'em_andamento') continue
    const cached = await getProtocol(execution.protocolId)
    const stepsData = cached?.current_version?.steps_data
    if (!stepsData) continue

    const engine = new GuidedProtocolInterpreter(stepsData)
    const reminders = buildReminders(execution.history, (id) => engine.getStep(id))
    for (const reminder of reminders) {
      out.push({ clientUuid: execution.clientUuid, reminder })
    }
  }

  return out
}

const scheduled = new Map<string, ReturnType<typeof setTimeout>>()
const notified = new Set<string>()

function fire(key: string, reminder: Reminder): void {
  scheduled.delete(key)
  notified.add(key)
  notify({
    title: 'Reavaliação devida',
    body: `${reminder.stepTitle} — reavaliar agora.`,
    tag: key,
  })
}

/**
 * Cancel stale timers, then schedule a `notify()` for every pending reminder.
 * Idempotent: safe to call on boot, reconnect, and app re-focus.
 */
async function rearm(): Promise<void> {
  const now = Date.now()
  const items = await computeActiveReminders()
  const activeKeys = new Set(items.map((i) => reminderKey(i.clientUuid, i.reminder)))

  // Drop timers/notifications for reminders that no longer apply (execution moved on).
  for (const [key, id] of scheduled) {
    if (!activeKeys.has(key)) {
      clearTimeout(id)
      scheduled.delete(key)
    }
  }
  for (const key of notified) {
    if (!activeKeys.has(key)) notified.delete(key)
  }

  for (const { clientUuid, reminder } of items) {
    const key = reminderKey(clientUuid, reminder)
    if (notified.has(key) || scheduled.has(key)) continue

    const delay = new Date(reminder.dueAt).getTime() - now
    if (delay <= 0) {
      fire(key, reminder)
    } else {
      scheduled.set(
        key,
        setTimeout(() => fire(key, reminder), delay),
      )
    }
  }
}

let started = false

function handleOnline(): void {
  void rearm()
}

function handleVisibility(): void {
  if (document.visibilityState === 'visible') void rearm()
}

/** Arm reminder timers; re-arms on reconnect and when the app regains focus. */
export function startReminderScheduler(): void {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibility)
  void rearm()
}

export function stopReminderScheduler(): void {
  if (!started) return
  started = false
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibility)
  for (const id of scheduled.values()) clearTimeout(id)
  scheduled.clear()
  notified.clear()
}

/** Force a recompute (e.g. right after answering a step). */
export function refreshReminderScheduler(): void {
  if (!started) return
  void rearm()
}

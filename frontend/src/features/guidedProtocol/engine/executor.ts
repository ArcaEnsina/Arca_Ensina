import type { AnswerValues, Execution, Reminder, StepResponse } from '../types';

/**
 * Engine seam: the runner depends on this interface, not on the API directly.
 *
 * The only implementation today is `apiExecutor` (backend-driven). The offline
 * JS engine (EXP-001b) will add a `localExecutor` behind a navigator.onLine
 * switch with no changes to the orchestrator hook or renderers.
 */
export interface IProtocolExecutor {
  /** Start (or idempotently resume) an execution. Returns the full execution. */
  start(
    protocolId: number,
    patientName: string,
    clientUuid: string,
  ): Promise<Execution>;
  /** Fetch the current step of the active execution. */
  getStep(protocolId: number): Promise<StepResponse>;
  /** Submit an answer for the current (answerable) step. Returns the full execution. */
  answer(protocolId: number, values: AnswerValues): Promise<Execution>;
  /** Advance past a display-only step. Returns the next step. */
  advance(protocolId: number): Promise<StepResponse>;
  /** Fetch in-execution reminders (wait_reassess countdowns). */
  getReminders(protocolId: number): Promise<Reminder[]>;
}

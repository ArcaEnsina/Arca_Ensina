import type { ReactNode } from 'react';
import { PatientInfoCard } from '@/features/sedacao/components/PatientInfoCard';
import type { Patient } from '@/features/patient/types';
import { useGuidedProtocolStore } from '../store';
import { ExecutionErrorBoundary } from './ExecutionErrorBoundary';
import { DecisionTimeline } from './DecisionTimeline';
import { ActiveTimerBanner } from './ActiveTimerBanner';
import { ProtocolStepper } from '@/components/ProtocolStepper';
import type { Reminder } from '../types';

interface ProtocolExecutionShellProps {
  patient: Patient;
  /** Hide the progress stepper (e.g. on the completion screen). */
  showStepper?: boolean;
  /** Active reminders, to surface a running timer on any step. */
  reminders?: Reminder[];
  /** Id of the step on screen, so the banner hides on its own timer step. */
  currentStepId?: string;
  children: ReactNode;
}

export function ProtocolExecutionShell({
  patient,
  showStepper = true,
  reminders = [],
  currentStepId,
  children,
}: ProtocolExecutionShellProps) {
  const completedCount = useGuidedProtocolStore((s) => s.history.length);

  return (
    <ExecutionErrorBoundary>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-28 sm:px-6 lg:flex-row lg:items-start">
        <main className="flex w-full max-w-lg flex-col gap-6 lg:mx-0">
          <PatientInfoCard patient={patient} />
          <ActiveTimerBanner reminders={reminders} currentStepId={currentStepId} />
          {showStepper && <ProtocolStepper completedCount={completedCount} />}
          {children}
        </main>
        <aside className="w-full lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
          <DecisionTimeline />
        </aside>
      </div>
    </ExecutionErrorBoundary>
  );
}

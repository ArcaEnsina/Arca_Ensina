import type { ReactNode } from 'react';
import { PatientInfoCard } from '@/features/sedacao/components/PatientInfoCard';
import type { Patient } from '@/features/patient/types';
import { useGuidedProtocolStore } from '../store';
import { ExecutionErrorBoundary } from './ExecutionErrorBoundary';
import { DecisionTimeline } from './DecisionTimeline';
import { ProtocolStepper } from '@/components/ProtocolStepper';

interface ProtocolExecutionShellProps {
  patient: Patient;
  /** Hide the progress stepper (e.g. on the completion screen). */
  showStepper?: boolean;
  children: ReactNode;
}

export function ProtocolExecutionShell({
  patient,
  showStepper = true,
  children,
}: ProtocolExecutionShellProps) {
  const completedCount = useGuidedProtocolStore((s) => s.history.length);

  return (
    <ExecutionErrorBoundary>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-28 sm:px-6 lg:flex-row lg:items-start">
        <main className="flex w-full max-w-lg flex-col gap-6 lg:mx-0">
          <PatientInfoCard patient={patient} />
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

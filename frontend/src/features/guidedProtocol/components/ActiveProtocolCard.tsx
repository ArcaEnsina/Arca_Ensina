import { useNavigate } from 'react-router';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGuidedProtocolStore } from '../store';
import { ReminderCountdown } from './ReminderCountdown';
import {
  getSoonestReminder,
  type ActiveExecutionSummary,
} from '../hooks/useActiveExecution';
import type { HistoryEntry, StepType } from '../types';

interface ActiveProtocolCardProps {
  data: ActiveExecutionSummary;
}

/**
 * Dashboard card shown (in place of the protocol suggestion) when the selected
 * patient has a guided protocol in progress. Surfaces the active timer and a
 * "Retomar" action that re-enters the execution at the current step.
 */
export function ActiveProtocolCard({ data }: ActiveProtocolCardProps) {
  const navigate = useNavigate();
  const primeResume = useGuidedProtocolStore((s) => s.primeResume);

  const reminder = getSoonestReminder(data.reminders);
  const overdue = reminder?.status === 'overdue';

  const handleResume = () => {
    primeResume({
      clientUuid: data.clientUuid,
      protocolId: Number(data.protocolId),
      currentStepKey: data.currentStepKey || null,
      history: data.history.map(
        (h): HistoryEntry => ({
          stepKey: h.stepKey,
          stepType: h.stepType as StepType,
          title: h.title,
          values: h.values,
          answeredAt: h.answeredAt,
        }),
      ),
    });
    navigate(`/guided-protocol/${data.protocolId}`);
  };

  return (
    <div className="bg-neutral-900 rounded-2xl shadow-md p-5 tablet:p-6 text-white">
      <span className="inline-flex items-center gap-2 text-caption font-medium tracking-widest text-neutral-400 uppercase">
        <Activity size={14} className="text-arca-blue-300" />
        EM ANDAMENTO
      </span>
      <h2 className="text-heading-lg font-semibold text-white mt-2">
        {data.protocolTitle}
      </h2>
      <p className="text-body-md text-neutral-400 mt-1">
        {data.completedCount}{' '}
        {data.completedCount === 1 ? 'passo registrado' : 'passos registrados'}
      </p>

      {reminder?.dueAt && (
        <div
          className={cn(
            'mt-4 flex items-center justify-between rounded-xl px-4 py-3',
            overdue ? 'bg-arca-red-600/20' : 'bg-white/5',
          )}
        >
          <span className="text-body-sm text-neutral-300">
            {overdue ? 'Reavaliação devida' : 'Reavaliar em'}
          </span>
          <ReminderCountdown
            dueAt={reminder.dueAt}
            showIcon={false}
            className={cn(
              'text-heading-lg font-bold',
              overdue ? 'text-arca-red-300' : 'text-white',
            )}
          />
        </div>
      )}

      <div className="mt-5 flex">
        <Button
          variant="default"
          size="lg"
          className="w-full bg-white text-neutral-900 hover:bg-neutral-100 rounded-full"
          onClick={handleResume}
        >
          <span className="inline-flex items-center justify-center gap-2">
            Retomar protocolo
            <ArrowRight size={18} />
          </span>
        </Button>
      </div>
    </div>
  );
}

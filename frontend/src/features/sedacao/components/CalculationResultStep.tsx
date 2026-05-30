import { ArrowLeft, ShieldCheck, AlertTriangle, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PanelCalculationResult } from '../types';
import { useSedationStore } from '../store';
import { usePatientStore } from '@/features/patient/store';
import { getDrugById } from '../api';

interface CalculationResultStepProps {
  result: PanelCalculationResult;
  onBack: () => void;
  onPrescribe: () => void;
  prescribing: boolean;
}

export function CalculationResultStep({
  result,
  onBack,
  onPrescribe,
  prescribing,
}: CalculationResultStepProps) {
  const { sourceDrugId, targetDrugId, currentDose } = useSedationStore();
  const patientWeight = usePatientStore((s) => s.activePatient?.peso);
  const sourceDrug = sourceDrugId ? getDrugById(sourceDrugId) : undefined;
  const hasWarnings = result.warnings.length > 0;
  const firstWarning = result.warnings[0];

  const isSafe = !hasWarnings;

  return (
    <div className="flex flex-col gap-6">
      {/* Header: source → destination */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
          <Pill className="size-4 text-gray-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-700">
            {sourceDrugId?.split(' ')[0] ?? '—'}
          </span>
        </div>
        <span className="text-lg text-gray-400" aria-hidden="true">→</span>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
          <Pill className="size-4 text-blue-700" aria-hidden="true" />
          <span className="text-sm font-semibold text-blue-700">
            {targetDrugId?.split(' ')[0] ?? '—'}
          </span>
        </div>
      </div>

      {/* Green/amber result card */}
      <div
        className={cn(
          'rounded-4xl border-2 p-6',
          isSafe ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50',
        )}
        role={hasWarnings ? 'alert' : 'status'}
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          {isSafe ? (
            <ShieldCheck className="size-5 text-green-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-5 text-yellow-600" aria-hidden="true" />
          )}
          <span className={cn('text-xs font-bold uppercase tracking-wider', isSafe ? 'text-green-700' : 'text-yellow-700')}>
            {isSafe ? 'Dentro do intervalo seguro' : 'Atenção — dose fora do intervalo'}
          </span>
        </div>

        <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-gray-900">
          {result.perDose.value}{' '}
          <span className="text-lg font-medium text-gray-500">{result.perDose.unit}</span>
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{result.frequency}</span>
          <span className="text-gray-400">·</span>
          <span>{result.dosesPerDay}x ao dia</span>
        </div>

        <p className="mt-1 text-sm text-gray-600">
          Total:{' '}
          <span className="font-mono font-semibold tabular-nums">
            {result.totalDaily.value}
          </span>{' '}
          {result.totalDaily.unit}
        </p>

        {/* Formula applied */}
        <p className="mt-3 rounded-xl bg-white/60 px-3 py-1.5 font-mono text-xs text-gray-500">
          {result.formulaApplied}
        </p>
      </div>

      {/* Warning box */}
      {hasWarnings && firstWarning && (
        <div className="rounded-4xl border border-yellow-200 bg-yellow-50 p-4" role="alert">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">{firstWarning.type === 'above_max_recommended' ? 'Dose acima do máximo' : 'Dose abaixo do mínimo'}</p>
              <p className="mt-1 text-xs text-yellow-700">{firstWarning.message}</p>
              <p className="mt-1 text-xs text-yellow-600">
                Recomendada:{' '}
                <span className="font-mono font-semibold tabular-nums">
                  {result.recommended.value} {result.recommended.unit}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-2">
        <InfoRow label="Dose atual" value={`${currentDose} ${sourceDrug?.doseUnit ?? ''}`} />
        <InfoRow label="Peso" value={`${patientWeight ?? '—'} kg`} />
        <InfoRow label="Via de administração" value={sourceDrug?.route ?? '—'} />
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white/95 py-4 backdrop-blur-sm">
        <Button variant="ghost" size="lg" onClick={onBack} className="gap-1">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button size="lg" onClick={onPrescribe} disabled={prescribing}>
          {prescribing ? 'Prescrevendo...' : 'Prescrever'}
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

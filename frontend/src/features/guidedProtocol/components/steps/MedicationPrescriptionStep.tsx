import { ArrowRight, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Medication, MedicationPrescriptionStepData } from '../../types';

interface MedicationPrescriptionStepProps {
  step: MedicationPrescriptionStepData;
  onAdvance: () => void;
  submitting: boolean;
}

/** A labelled field, rendered only when the medication carries that value. */
function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-body-sm font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-body-md whitespace-pre-line">{value}</dd>
    </div>
  );
}

function MedicationCard({ med }: { med: Medication }) {
  return (
    <Card className="border-blue-200">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Pill className="size-5 text-blue-700" aria-hidden="true" />
          <h3 className="text-display-sm text-blue-900">{med.name}</h3>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* fix3 #2: surface dose_inicial / dose_max / indication / preparation / volume */}
          <Field label="Indicação" value={med.indication} />
          <Field label="Dose" value={med.dose} />
          <Field label="Dose inicial" value={med.doseInicial} />
          <Field label="Dose máxima" value={med.doseMax} />
          <Field label="Via" value={med.route} />
          <Field label="Frequência" value={med.frequency} />
          <Field label="Volume" value={med.volume} />
        </dl>
        <Field label="Preparo" value={med.preparation} />
        {med.notes && (
          <p className="text-body-sm whitespace-pre-line rounded-lg bg-blue-50 p-3 text-blue-900">
            {med.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MedicationPrescriptionStep({
  step,
  onAdvance,
  submitting,
}: MedicationPrescriptionStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-display-sm text-blue-900">{step.title}</h2>
        {step.description && (
          <p className="text-body-md whitespace-pre-line text-muted-foreground">
            {step.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {step.medications.map((med, idx) => (
          <MedicationCard key={med.name ?? idx} med={med} />
        ))}
      </div>

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

import { ArrowRight, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeading } from '../StepHeading';
import { InfoBanner } from '../InfoBanner';
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
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-body-md whitespace-pre-line text-foreground">{value}</dd>
    </div>
  );
}

function MedicationCard({ med }: { med: Medication }) {
  return (
    <Card className="ring-arca-blue-100">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-arca-blue-50 text-arca-blue-700"
            aria-hidden="true"
          >
            <Pill className="size-5" />
          </span>
          <h3 className="text-heading-lg font-bold text-arca-blue-900">{med.name}</h3>
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
        {med.notes && <InfoBanner>{med.notes}</InfoBanner>}
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
      <StepHeading title={step.title} description={step.description} />

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

import { usePatientStore } from '@/features/patient/store';
import PatientSelector from '@/features/calculator/components/PatientSelector';
import { useSedationPanel } from '../hooks/useSedationPanel';
import { usePanelDrugs } from '../api';
import { SedationErrorBoundary } from '../components/SedationErrorBoundary';
import { SedationStepper } from '../components/SedationStepper';
import { PatientInfoCard } from '../components/PatientInfoCard';
import { PanelInfoCard } from '../components/PanelInfoCard';
import { ConversionMatrix } from '../components/ConversionMatrix';
import { BottomActionBar } from '../components/BottomActionBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SedationPanelContent() {
  const activePatient = usePatientStore((s) => s.activePatient);
  const setActivePatient = usePatientStore((s) => s.setActivePatient);
  const { data: drugOptions = [], error: drugError } = usePanelDrugs();
  const {
    form,
    result,
    loading,
    phase,
    calculate,
    onPrescribe,
    prescribing,
    selectedDose,
    setSelectedDose,
  } = useSedationPanel();

  if (!activePatient) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-display-sm">Painel de Sedação</h1>
          <p className="text-body-md text-muted-foreground">
            Selecione um paciente para continuar.
          </p>
          <PatientSelector
            selectedId={null}
            onSelect={(patient) => setActivePatient(patient)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-24 px-4 sm:px-6">
      <SedationStepper currentPhase={phase} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PatientInfoCard patient={activePatient} />
        <PanelInfoCard panelName="Protocolo de Sedação e Analgesia em UTIP" panelType="painel" version="1.0" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversão de Medicamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ConversionMatrix
            form={form}
            drugOptions={drugOptions}
            drugError={drugError}
            result={result}
            loading={loading}
            onCalculate={calculate}
            selectedDose={selectedDose}
            onSelectDose={setSelectedDose}
          />
        </CardContent>
      </Card>

      <BottomActionBar
        infoText="Revise a dose convertida antes de prescrever."
        ctaText={prescribing ? 'Prescrevendo...' : 'Prescrever'}
        onCta={onPrescribe}
        disabled={!result || prescribing}
      />
    </div>
  );
}

export default function SedationPanelPage() {
  return (
    <SedationErrorBoundary>
      <SedationPanelContent />
    </SedationErrorBoundary>
  );
}

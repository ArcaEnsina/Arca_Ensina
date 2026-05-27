import { usePatientStore } from '@/features/patient/store';
import PatientSelector from '@/features/calculator/components/PatientSelector';
import { useSedationPanel } from '../hooks/useSedationPanel';
import { SedationErrorBoundary } from '../components/SedationErrorBoundary';
import { StepIndicator } from '../components/StepIndicator';
import { PatientInfoCard } from '../components/PatientInfoCard';
import { DrugSelectionStep } from '../components/DrugSelectionStep';
import { CalculationResultStep } from '../components/CalculationResultStep';
import { TaperingStep } from '../components/TaperingStep';
import { ReviewStep } from '../components/ReviewStep';

function SedationPanelContent() {
  const activePatient = usePatientStore((s) => s.activePatient);
  const setActivePatient = usePatientStore((s) => s.setActivePatient);
  const {
    result,
    loading,
    phase,
    calculate,
    onPrescribe,
    prescribing,
    taperSchedule,
    onFinish,
    finishing,
    goToSelect,
    goToConvert,
    goToTaper,
    goToReview,
  } = useSedationPanel();

  if (!activePatient) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6">
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
    <div className="mx-auto flex max-w-lg flex-col gap-6 pb-24 px-4 sm:px-6">
      {/* Patient info bar */}
      <PatientInfoCard patient={activePatient} />

      {/* Step indicator */}
      <StepIndicator currentPhase={phase} />

      {/* Step content */}
      {phase === 'select' && (
        <DrugSelectionStep onNext={calculate} />
      )}

      {phase === 'convert' && (
        loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
            <p className="text-sm text-muted-foreground">Calculando dose...</p>
          </div>
        ) : result ? (
          <CalculationResultStep
            result={result}
            onBack={goToSelect}
            onPrescribe={onPrescribe}
            prescribing={prescribing}
          />
        ) : null
      )}

      {phase === 'taper' && taperSchedule && (
        <TaperingStep
          schedule={taperSchedule}
          onBack={goToConvert}
          onNext={goToReview}
        />
      )}

      {phase === 'review' && (
        <ReviewStep
          onBack={goToTaper}
          onFinish={onFinish}
          finishing={finishing}
        />
      )}
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

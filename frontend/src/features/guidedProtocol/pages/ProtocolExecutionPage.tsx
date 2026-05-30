import { useParams, useNavigate, Navigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePatientStore } from '@/features/patient/store';
import PatientSelector from '@/features/calculator/components/PatientSelector';
import { useProtocolExecution } from '../hooks/useProtocolExecution';
import { ProtocolExecutionShell } from '../components/ProtocolExecutionShell';
import { StepRenderer } from '../components/StepRenderer';

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="size-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
      <p className="text-sm text-muted-foreground">Carregando protocolo…</p>
    </div>
  );
}

function CompletionView() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="size-12 text-green-600" aria-hidden="true" />
        <h2 className="text-display-sm text-blue-900">Protocolo concluído</h2>
        <p className="text-body-md text-muted-foreground">
          A execução foi finalizada. As decisões ficam registradas na linha do
          tempo e no histórico do paciente.
        </p>
        <Button
          size="lg"
          className="rounded-2xl"
          onClick={() => navigate('/dashboard')}
        >
          Voltar ao dashboard
        </Button>
      </CardContent>
    </Card>
  );
}

function ExecutionRunner({ protocolId }: { protocolId: number }) {
  const activePatient = usePatientStore((s) => s.activePatient)!;
  const {
    step,
    gateWarnings,
    reminders,
    currentIteration,
    completed,
    bootstrapping,
    submitting,
    submitAnswer,
    advance,
  } = useProtocolExecution({
    protocolId,
    patientName: activePatient.nome,
  });

  return (
    <ProtocolExecutionShell patient={activePatient}>
      {bootstrapping ? (
        <LoadingState />
      ) : completed || !step ? (
        <CompletionView />
      ) : (
        <StepRenderer
          step={step}
          gateWarnings={gateWarnings}
          reminders={reminders}
          currentIteration={currentIteration}
          submitting={submitting}
          onAnswer={submitAnswer}
          onAdvance={advance}
        />
      )}
    </ProtocolExecutionShell>
  );
}

export default function ProtocolExecutionPage() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const activePatient = usePatientStore((s) => s.activePatient);
  const setActivePatient = usePatientStore((s) => s.setActivePatient);

  const pk = Number(protocolId);
  if (!protocolId || Number.isNaN(pk)) {
    return <Navigate to="/guided-protocol" replace />;
  }

  // Patient gate — mirrors the sedation panel flow.
  if (!activePatient) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-display-sm">Execução de Protocolo</h1>
          <p className="text-body-md text-muted-foreground">
            Selecione um paciente para continuar.
          </p>
          <PatientSelector selectedId={null} onSelect={setActivePatient} />
        </div>
      </div>
    );
  }

  return <ExecutionRunner protocolId={pk} />;
}

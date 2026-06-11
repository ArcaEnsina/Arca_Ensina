import { useParams, useNavigate, Navigate } from 'react-router';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
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
      <div className="size-8 animate-spin rounded-full border-4 border-arca-blue-200 border-t-arca-blue-700" />
      <p className="text-sm text-muted-foreground">Carregando protocolo…</p>
    </div>
  );
}

function CompletionView() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span
          className="flex size-16 items-center justify-center rounded-full bg-arca-blue-50 text-arca-blue-700"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-9" />
        </span>
        <h2 className="text-display-sm text-arca-blue-900">Protocolo concluído</h2>
        <p className="text-body-md max-w-sm text-muted-foreground">
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

function ErrorState() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span
          className="flex size-16 items-center justify-center rounded-full bg-danger/10 text-danger"
          aria-hidden="true"
        >
          <AlertTriangle className="size-9" />
        </span>
        <h2 className="text-display-sm text-arca-blue-900">
          Não foi possível iniciar o protocolo
        </h2>
        <p className="text-body-md max-w-sm text-muted-foreground">
          Verifique se o protocolo foi baixado para uso offline. Se o problema
          persistir, baixe-o novamente com conexão à internet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
          <Button
            size="lg"
            className="rounded-2xl"
            onClick={() => navigate('/guided-protocol')}
          >
            Voltar aos protocolos
          </Button>
        </div>
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
    error,
    submitting,
    canGoBack,
    submitAnswer,
    advance,
    goBack,
  } = useProtocolExecution({
    protocolId,
    patientName: activePatient.nome,
    patientId: Number(activePatient.id),
  });

  return (
    <ProtocolExecutionShell
      patient={activePatient}
      showStepper={!bootstrapping && !error && !completed && !!step}
      reminders={reminders}
      currentStepId={step?.id}
    >
      {bootstrapping ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : completed || !step ? (
        <CompletionView />
      ) : (
        <StepRenderer
          step={step}
          gateWarnings={gateWarnings}
          reminders={reminders}
          currentIteration={currentIteration}
          submitting={submitting}
          canGoBack={canGoBack}
          onAnswer={submitAnswer}
          onAdvance={advance}
          onBack={goBack}
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

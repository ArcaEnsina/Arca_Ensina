import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "@/features/guidedProtocol/components/shared/ProtocolStepper";
import { YesNoStep } from "@/features/guidedProtocol/components/shared/YesNoStep";


const TOTAL_STEPS = 6;
const CURRENT_STEP = 3;
const NEXT_STEP = 4;

export default function GuidedProtocolStep3Page() {
  const navigate = useNavigate();
  const { protocolId } = useParams<{ protocolId: string }>();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || undefined;
  const [answer, setAnswer] = useState<boolean | null>(null);

  function handleContinue() {
    navigate(`/guided-protocol/${protocolId}/step/${NEXT_STEP}?patientId=${patientId}`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <YesNoStep
        title="Paciente apresenta sinais de Choque?"
        description="Considere: extremidades frias, enchimento capilar lento, pulso fraco, taquicardia, hipotensão"
        value={answer}
        onChange={setAnswer}
      />

      <Button
        size="xl"
        className="w-full gap-3 rounded-2xl tracking-widest"
        onClick={handleContinue}
        disabled={answer === null}
      >
        CONTINUAR
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
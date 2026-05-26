import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { YesNoStep } from "../components/YesNoStep";
import { ProtocolMiniHeader } from "../components/ProtocolMiniHeader";
import { MOCK_PATIENT, MOCK_PROTOCOL } from "./GuidedProtocolPage";

const TOTAL_STEPS = 6;
const CURRENT_STEP = 3;

export default function GuidedProtocolStep3Page() {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState<boolean | null>(null);

  function handleContinue() {
    navigate("/guided-protocol/step/4");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <ProtocolMiniHeader patient={MOCK_PATIENT} protocol={MOCK_PROTOCOL} />

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
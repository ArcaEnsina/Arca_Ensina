import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { ProtocolMiniHeader } from "../components/ProtocolMiniHeader";
import { ReavaliationCard } from "../components/ReavaliationCard";
import { MOCK_PATIENT, MOCK_PROTOCOL } from "./GuidedProtocolPage";
import { Info } from "lucide-react";

const TOTAL_STEPS = 6;
const CURRENT_STEP = 6;

export default function GuidedProtocolStep6Page() {
  const navigate = useNavigate();

  function handleFinish() {
    navigate("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <div className="w-full max-w-[500px] self-center">
        <ProtocolMiniHeader
          patient={MOCK_PATIENT}
          protocol={MOCK_PROTOCOL}
        />
      </div>

      <div className="w-full">
        <h2 className="text-display-sm font-heading font-bold text-foreground">
          Monitiramento e Revisão
        </h2>
        <p className="text-body-md text-muted-foreground mt-1">
          Reavalie o paciente após a expansão volêmica
        </p>
      </div>

      <div className="w-[780px] max-w-none">
        <ReavaliationCard onNextStep={() => navigate("/dashboard")} />
      </div>

      <div className="w-[780px] max-w-none">
        <div className="flex w-full items-center justify-between gap-3 rounded-2xl bg-arca-blue-50 p-4">
          
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-arca-blue-50">
              <Info className="h-4 w-4 text-arca-blue-600" />
            </div>

            <p className="text-body-md text-foreground">
              Administrar 186 ml de SF 0,9% em 20 minutos
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={handleFinish}
          >
            FINALIZAR ATENDIMENTO
          </Button>

        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { ProtocolInfoBanner } from "../components/ProtocolInfoBanner";
import ProtocolMainHeader from "@/features/guidedProtocol/components/layout/ProtocolMainHeader";
import ProtocolSelectionSection from "@/features/guidedProtocol/components/layout/ProtocolSelectionSection";
import { useProtocolSelection } from "@/features/guidedProtocol/hooks/useProtocolSelection";

const TOTAL_STEPS = 6;

export default function GuidedProtocolPage() {
  const navigate = useNavigate();
  const [currentStep] = useState(1);
  const { selectedProtocol, selectedPatient } = useProtocolSelection();

  function handleStart() {
    if (!selectedProtocol) return;
    navigate(`/guided-protocol/${selectedProtocol.id}/step/${currentStep + 1}?patientId=${selectedPatient?.id}`);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 overflow-hidden px-4 py-6">

      <ProtocolMainHeader />

      <ProtocolStepper
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
      />

      <ProtocolSelectionSection />

      <ProtocolInfoBanner message="Indicado para pacientes com sinais de alarme e/ou critérios de gravidade" />

      <Button
        size="xl"
        className="w-full gap-3 rounded-2xl tracking-widest"
        onClick={handleStart}
        disabled={!selectedProtocol || !selectedPatient}
      >
        INICIAR PROTOCOLO
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
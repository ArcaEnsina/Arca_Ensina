import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "@/features/guidedProtocol/components/shared/ProtocolStepper";
import { ProtocolInfoBanner } from "@/features/guidedProtocol/components/shared/ProtocolInfoBanner";
import ProtocolMainHeader from "@/features/guidedProtocol/components/layout/ProtocolMainHeader";
import ProtocolSelectionSection from "@/features/guidedProtocol/components/layout/ProtocolSelectionSection";
import { useProtocolSelection } from "@/features/guidedProtocol/hooks/useProtocolSelection";
import { usePatient } from "@/features/guidedProtocol/api";
import type { Protocol } from "@/features/guidedProtocol/types";

const TOTAL_STEPS = 6;

const MOCK_PROTOCOL: Protocol = {
  id: 'dengue',
  name: 'Protocolo de Dengue',
  subtitle: 'Manejo clínico conforme diretrizes vigentes',
  group: 'Doenças Infecciosas',
  isActive: true,
};

export default function GuidedProtocolPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep] = useState(1);
  const { selectedProtocol, selectedPatient, setSelectedPatient, setSelectedProtocol } = useProtocolSelection();

  const protocolId = searchParams.get('protocolId');
  const patientId = searchParams.get('patientId');
  const { data: patient } = usePatient(patientId ?? undefined);

  useEffect(() => {
    if (protocolId && !selectedProtocol) {
      setSelectedProtocol(MOCK_PROTOCOL);
    }
  }, [protocolId, selectedProtocol, setSelectedProtocol]);

  useEffect(() => {
    if (patient && !selectedPatient) {
      setSelectedPatient(patient);
    }
  }, [patient, selectedPatient, setSelectedPatient]);

  function handleSwapProtocol() {
    setSelectedProtocol(null);
  }

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

      <ProtocolSelectionSection
        selectedProtocol={selectedProtocol}
        selectedPatient={selectedPatient}
        onSwapProtocol={handleSwapProtocol}
      />

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
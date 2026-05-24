import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { PatientCard } from "../components/PatientCard";
import { ProtocolCard } from "../components/ProtocolCard";
import { ProtocolInfoBanner } from "../components/ProtocolInfoBanner";
import type { Patient } from "@/features/patient";
import type { Protocol } from "../types";

const MOCK_PATIENT: Patient = { //dps trocar para dados reais
  id: "000123",
  nome: "Teste da Silva",
  dataNascimento: "2019-01-01",
  genero: "M",
  telefone: "",
  peso: "20",
  altura: "110",
  alergias: [],
  sintomas: [],
};

const MOCK_PROTOCOL: Protocol = {
  id: "dengue-d",
  name: "Protocolo Dengue",
  subtitle: "Manejo clínico · Hospitalar",
  group: "Grupo D",
};

const TOTAL_STEPS = 6;

export default function GuidedProtocolPage() {
  const navigate = useNavigate();
  const [currentStep] = useState(1);
  const [protocol] = useState<Protocol>(MOCK_PROTOCOL);

  function handleSwapProtocol() {
    console.log("Trocar protocolo");
  }

  function handleStart() {
    navigate(`/guided-protocol/step/${currentStep + 1}`);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 overflow-hidden px-4 py-6">

      <h1 className="text-display-sm font-heading tracking-widest text-foreground">
        PROTOCOLOS GUIADOS
      </h1>

      <ProtocolStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="grid w-full grid-cols-2 gap-3 items-start">
        <PatientCard patient={MOCK_PATIENT} />
        <ProtocolCard protocol={protocol} onSwap={handleSwapProtocol} />
      </div>

      <ProtocolInfoBanner message="Indicado para pacientes com sinais de alarme e/ou critérios de gravidade" />

      <Button
        size="xl"
        className="w-full gap-3 rounded-2xl tracking-widest"
        onClick={handleStart}
      >
        INICIAR PROTOCOLO
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

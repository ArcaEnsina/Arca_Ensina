import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { ChecklistStep } from "../components/ChecklistStep";
import { ClassificationBanner } from "../components/ClassificationBanner";

//por enquanto os dados são fictícios
const GRAVIDADE_ITEMS = [
  { id: "a1", label: "Dor abdominal intensa e contínua" },
  { id: "a2", label: "Sangramento de mucosa ou outras hemorragias" },
  { id: "a3", label: "Acúmulo de líquidos" },
  { id: "a4", label: "Letargia ou irritabilidade" },
  { id: "a5", label: "Vômitos constantes" },
  { id: "a6", label: "Hepatomegalia > 2cm" },
];

const TOTAL_STEPS = 6;
const CURRENT_STEP = 2;

function getClassification(checked: string[]): string {
  if (checked.length >= 1) return "GRAVE";
  return "—";
}
export default function GuidedProtocolStep2Page() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<string[]>([]);

  function handleToggle(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    navigate("/guided-protocol/step/3");
  }

  const classification = getClassification(checked);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <ChecklistStep
        title="Avalie os sinais de gravidade"
        items={GRAVIDADE_ITEMS}
        checked={checked}
        onChange={handleToggle}
      />

      <ClassificationBanner
        label="Classificação atual"
        value={classification}
      />

      <Button
        size="xl"
        className="w-full gap-3 rounded-2xl tracking-widest"
        onClick={handleContinue}
      >
        CONTINUAR
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

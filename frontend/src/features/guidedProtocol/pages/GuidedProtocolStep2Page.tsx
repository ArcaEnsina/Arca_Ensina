import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtocolStepper } from "@/features/guidedProtocol/components/shared/ProtocolStepper";
import { ChecklistStep } from "@/features/guidedProtocol/components/shared/ChecklistStep";
import { ClassificationBanner } from "@/features/guidedProtocol/components/shared/ClassificationBanner";
import { useProtocolVersion } from "@/features/guidedProtocol/api";
import { Skeleton } from "@/components/ui/skeleton";

const TOTAL_STEPS = 6;
const CURRENT_STEP = 2;
const NEXT_STEP = 3;

// Mapeamento de step number para step ID no JSON (ajustar conforme seu protocolo)
const STEP_ID_MAP: Record<number, string> = {
  2: "step_1_gravidade",
};

function getClassification(checked: string[]): string {
  if (checked.length >= 1) return "GRAVE";
  return "—";
}

interface ChecklistItem {
  id: string;
  label: string;
}

export default function GuidedProtocolStep2Page() {
  const navigate = useNavigate();
  const { protocolId } = useParams<{ protocolId: string }>();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || undefined;
  const [checked, setChecked] = useState<string[]>([]);

  // Buscar dados do protocolo
  const { data: protocolVersion, isLoading: isLoadingVersion } = useProtocolVersion(protocolId || "");

  // Extrair dados do step de checklist do JSON
  const { stepData, checklistItems } = useMemo(() => {
    if (!protocolVersion?.stepsData) {
      return { stepData: null, checklistItems: [] };
    }

    const stepsArray = (protocolVersion.stepsData as Record<string, unknown>).steps as Array<Record<string, unknown>> || [];
    const stepKey = STEP_ID_MAP[CURRENT_STEP];
    const step = stepsArray.find((s) => s.id === stepKey);

    if (!step) {
      return { stepData: null, checklistItems: [] };
    }

    const items = (step.items as ChecklistItem[]) || [];
    return { stepData: step, checklistItems: items };
  }, [protocolVersion]);

  function handleToggle(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    navigate(`/guided-protocol/${protocolId}/step/${NEXT_STEP}?patientId=${patientId}`);
  }

  const classification = getClassification(checked);

  if (isLoadingVersion) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stepData || checklistItems.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
        <p className="text-center text-red-500">Erro: Dados do passo não encontrados</p>
        <Button onClick={() => navigate("/guided-protocol")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <ChecklistStep
        title={stepData.title as string || "Avalie os sinais de gravidade"}
        items={checklistItems}
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

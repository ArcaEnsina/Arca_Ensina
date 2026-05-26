import { useState } from "react";
import { useNavigate } from "react-router";
import { Scale, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ProtocolStepper } from "../components/ProtocolStepper";
import { ProtocolMiniHeader } from "../components/ProtocolMiniHeader";
import { MOCK_PATIENT, MOCK_PROTOCOL } from "./GuidedProtocolPage";

const TOTAL_STEPS = 6;
const CURRENT_STEP = 4;

const SYSTEM_WEIGHT = "15,2";
const UPDATED_AT = "15/04/2026 às 09:37"; //adicionar dados reais dps

export default function GuidedProtocolStep4Page() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(SYSTEM_WEIGHT);

  function handleConfirm() {
    navigate("/guided-protocol/step/5");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <ProtocolMiniHeader patient={MOCK_PATIENT} protocol={MOCK_PROTOCOL} />

      <div className="w-full">
        <h2 className="text-display-sm font-heading font-bold text-foreground">
          Peso do paciente
        </h2>
        <p className="text-body-md text-muted-foreground mt-1">
          Confirme o peso para o cálculo da expansão volêmica
        </p>
      </div>

      <Card className="w-full max-w-3xl">
        <CardContent className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-arca-blue-50">
            <Scale className="h-10 w-10 text-arca-blue-600" />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-body-md font-semibold text-foreground">
              Peso encontrado no sistema
            </p>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-28 text-2xl font-bold"
                  autoFocus
                />
                <span className="text-body-lg text-muted-foreground">kg</span>
              </div>
            ) : (
              <p className="text-numeric-hero font-numeric text-arca-blue-600">
                {weight}kg
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              Atualizado em {UPDATED_AT}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid w-full grid-cols-2 gap-3">
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={() => setEditing((e) => !e)}
        >
          <Pencil className="h-4 w-4" />
          EDITAR PESO
        </Button>
        <Button
          size="lg"
          variant="default"
          className="gap-2"
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4" />
          CONFIRMAR PESO
        </Button>
      </div>
    </div>
  );
}

import { useNavigate, useParams, useSearchParams } from "react-router";
import { Check, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtocolStepper } from "@/features/guidedProtocol/components/shared/ProtocolStepper";
import { ProtocolInfoBanner } from "@/features/guidedProtocol/components/shared/ProtocolInfoBanner";

const TOTAL_STEPS = 6;
const CURRENT_STEP = 5;
const NEXT_STEP = 6;

const PESO_KG = 18.6;
const DOSE_PER_KG = 10;
const VOLUME_ML = Math.round(PESO_KG * DOSE_PER_KG);
const SOLUCAO = "SF 0,9%";
const TEMPO_INFUSAO = "20 minutos";

export default function GuidedProtocolStep5Page() {
  const navigate = useNavigate();
  const { protocolId } = useParams<{ protocolId: string }>();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || undefined;

  function handleRegister() {
    navigate(`/guided-protocol/${protocolId}/step/${NEXT_STEP}?patientId=${patientId}`);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-lg flex-col items-center gap-6 px-4 py-6">
      <ProtocolStepper currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />

      <div className="w-full">
        <h2 className="text-display-sm font-heading font-bold text-foreground">
          Expansão volêmica (1ª fase)
        </h2>
        <p className="text-body-md text-muted-foreground mt-1">
          Cálculo automático com base no peso informado
        </p>
      </div>

      <div className="w-[600px] max-w-none">
        <Card className="w-full">
          <CardContent className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-arca-blue-50">
              <Syringe className="h-10 w-10 text-arca-blue-600" />
            </div>

            <div className="flex flex-col gap-0.5">
              <p className="text-body-md font-semibold text-foreground">
                Volume do bolus
              </p>

              <p className="text-numeric-hero font-numeric text-arca-blue-600">
                {VOLUME_ML}ml
              </p>

              <p className="text-caption text-muted-foreground">
                ({DOSE_PER_KG}ml/kg)
              </p>
            </div>

            <div className="h-20 w-px bg-border shrink-0" />

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-caption text-muted-foreground">Solução</p>
                <p className="text-body-md font-semibold text-arca-blue-600">
                  {SOLUCAO}
                </p>
              </div>

              <div>
                <p className="text-caption text-muted-foreground">
                  Tempo de infusão
                </p>

                <p className="text-body-md font-semibold text-arca-blue-600">
                  {TEMPO_INFUSAO}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProtocolInfoBanner
        message={`Administrar ${VOLUME_ML} ml de ${SOLUCAO} em ${TEMPO_INFUSAO}`}
      />

      <Button
        size="xl"
        className="w-full gap-3 rounded-2xl"
        onClick={handleRegister}
      >
        <Check className="h-5 w-5" />
        Registrar administração
      </Button>
    </div>
  );
}
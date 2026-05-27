import { Clock, Heart, Watch, Droplets, FlaskConical, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MONITOR_ITEMS = [
  { id: "sinais", label: "Sinais vitais (PA, FC, FR, SatO2)", icon: Heart },
  { id: "perfusao", label: "Estado de perfusão", icon: Watch },
  { id: "diurese", label: "Diurese", icon: Droplets },
  { id: "hematocrito", label: "Hematócrito", icon: FlaskConical },
];

interface ReavaliationCardProps {
  onNextStep?: () => void;
}

export function ReavaliationCard({ onNextStep }: ReavaliationCardProps) {
  return (
    <div className="grid w-full grid-cols-[3.5fr_1.5fr] gap-4">
      <Card className="flex-1 rounded-3xl">
        <CardContent className="grid h-full grid-cols-[140px_1px_1fr] gap-6 p-6">

          <div className="flex min-w-[140px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-arca-blue-50">
              <Clock className="h-8 w-8 text-arca-blue-600" />
            </div>

            <p className="mt-4 text-lg font-semibold text-foreground">
              Reavaliação
            </p>

            <p className="mt-5 text-2xl font-bold text-arca-blue-600">
              30 minutos
            </p>

            <p className="text-sm text-muted-foreground leading-tight">
              após o término do bolus
            </p>
          </div>

          <div className="w-px bg-border" />

          <div className="flex flex-1 flex-col justify-center gap-3">
            {MONITOR_ITEMS.map(({ id, label, icon: Icon }) => (
              <div
                key={id}
                className="flex h-16 w-full items-center gap-3 rounded-2xl border border-border px-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-arca-blue-50">
                  <Icon className="h-5 w-5 text-arca-blue-600" />
                </div>

                <p className="text-base text-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center rounded-3xl bg-arca-blue-50 px-5 py-6 text-center">
        <p className="text-sm font-medium text-arca-blue-600">
          Evolução
        </p>

        <div className="my-6 flex h-16 w-16 items-center justify-center rounded-full bg-arca-blue-600">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>

        <p className="text-3xl font-bold text-arca-blue-600">
          Estável
        </p>

        <p className="mt-2 text-sm leading-tight text-muted-foreground">
          Continuar hidratação conforme protocolo
        </p>

        <Button
          size="sm"
          variant="outline"
          onClick={onNextStep}
          className="mt-6 w-full rounded-xl"
        >
          VER PROXIMA ETAPA
        </Button>
      </div>
    </div>
  );
}
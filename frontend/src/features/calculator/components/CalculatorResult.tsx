import { AlertTriangle, OctagonAlert, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalculationResult, WarningLevel } from "../types";

function frequencyLabel(freq: number): string {
  const labels: Record<number, string> = {
    1: "1x ao dia (24/24h)",
    2: "2x ao dia (12/12h)",
    3: "3x ao dia (8/8h)",
    4: "4x ao dia (6/6h)",
    6: "6x ao dia (4/4h)",
  };
  return labels[freq] ?? `${freq}x ao dia`;
}

const WARNING_COPY: Record<WarningLevel, string> = {
  BAIXO: "Dose abaixo do mínimo recomendado.",
  ALTO: "Dose acima do máximo recomendado.",
  CRITICO: "Dose acima do teto absoluto | revise a prescrição.",
};

function WarningAlert({
  level,
  message,
  blocked,
}: {
  level: WarningLevel;
  message?: string;
  blocked?: boolean;
}) {
  const critical = level === "CRITICO";
  const Icon = blocked ? Ban : critical ? OctagonAlert : AlertTriangle;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3",
        critical
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-body-md font-medium">
        {message ?? WARNING_COPY[level]}{" "}
        <span className="font-semibold">({level})</span>
      </p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-numeric-md font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

interface CalculatorResultProps {
  result: CalculationResult;
}

function CalculatorResult({ result }: CalculatorResultProps) {
  // Prefere as mensagens estruturadas do motor; cai no copy legado se ausentes.
  const detail = result.warnings_detail ?? [];

  // detalhe entre parênteses no texto "Administrar...": volume/gotas ou unidades
  let detailUnit = "";
  if (result.volume_ml !== null) {
    detailUnit =
      result.drops !== null
        ? ` (${result.volume_ml} mL, ${result.drops} gotas)`
        : ` (${result.volume_ml} mL)`;
  } else if (result.units !== null) {
    detailUnit = ` (${result.units} ${result.unit_label ?? "un"})`;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-caption font-semibold tracking-wider text-muted-foreground uppercase">
        Resultado do cálculo
      </h2>

      {detail.length > 0 ? (
        <div className="flex flex-col gap-2">
          {detail.map((w, i) => (
            <WarningAlert
              key={`${w.type}-${i}`}
              level={w.severity}
              message={w.message}
              blocked={result.blocked && w.type === "contraindicated"}
            />
          ))}
        </div>
      ) : (
        result.warnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {result.warnings.map((level) => (
              <WarningAlert key={level} level={level} />
            ))}
          </div>
        )
      )}

      {result.blocked ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-body-md font-medium text-destructive">
          Medicamento contraindicado para este paciente/seleção. Ajuste a via,
          a apresentação ou os dados do paciente.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Dose diária" value={`${result.dosage_mg} mg`} />
            <StatTile label="Por dose" value={`${result.dosage_per_dose} mg`} />
            <StatTile
              label="Frequência"
              value={`${result.frequency_per_day}x ao dia`}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-3xl bg-arca-blue-600 p-5 text-white">
            <span className="text-caption font-medium tracking-wide text-white/70 uppercase">
              {result.volume_ml !== null
                ? "Volume por dose"
                : result.units !== null
                  ? "Quantidade por dose"
                  : "Administração"}
            </span>
            {result.volume_ml !== null ? (
              <span className="text-numeric-hero leading-none font-bold">
                {result.volume_ml}{" "}
                <span className="text-numeric-md font-semibold">mL</span>
                {result.drops !== null && (
                  <span className="text-numeric-md font-semibold">
                    {" "}
                    · {result.drops} gotas
                  </span>
                )}
              </span>
            ) : (
              result.units !== null && (
                <span className="text-numeric-hero leading-none font-bold">
                  {result.units}{" "}
                  <span className="text-numeric-md font-semibold">
                    {result.unit_label ?? "un"}
                  </span>
                </span>
              )
            )}
            <p className="text-body-md text-white/90">
              Administrar {result.dosage_per_dose} mg por dose
              {detailUnit}
              {result.frequency_per_day !== null &&
                `, ${frequencyLabel(result.frequency_per_day)}`}
              .
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default CalculatorResult;

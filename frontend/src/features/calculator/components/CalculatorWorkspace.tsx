import { useEffect, useRef, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Patient } from "@/features/patient";
import type {
  Medication,
  Presentation,
  CalculatorFormData,
  CalculatorFormDisplay,
} from "../types";
import { EMPTY_DISPLAY } from "../types";
import { convertBirthDate } from "../conversions";
import { useCalculatorForm } from "../hooks/useCalculatorForm";
import CalculatorMedicationInfo from "./CalculatorMedicationInfo";
import CalculatorForm from "./CalculatorForm";
import CalculatorResult from "./CalculatorResult";
import PatientSelector from "./PatientSelector";

type Mode = "patient" | "manual";

function ageToYearsMonths(ageDays: number): { years: number; months: number } {
  return {
    years: Math.floor(ageDays / 365),
    months: Math.floor((ageDays % 365) / 30),
  };
}

interface DerivedPatient {
  data: CalculatorFormData;
  weightLabel: string | null;
  heightLabel: string | null;
  ageLabel: string | null;
}

function derivePatient(patient: Patient, medicationId: number): DerivedPatient {
  const weight = patient.peso ? parseFloat(patient.peso) : NaN;
  const height = patient.altura ? parseFloat(patient.altura) : NaN;

  let ageDays: number | null = null;
  try {
    ageDays = convertBirthDate(patient.dataNascimento);
  } catch {
    ageDays = null;
  }
  const ageParts = ageDays !== null ? ageToYearsMonths(ageDays) : null;

  return {
    data: {
      weight: isNaN(weight) ? null : weight,
      height: isNaN(height) ? null : height,
      age_days: ageDays,
      medication_id: medicationId,
    },
    weightLabel: isNaN(weight) ? null : `${weight} kg`,
    heightLabel: isNaN(height) ? null : `${height} cm`,
    ageLabel: ageParts ? `${ageParts.years}a ${ageParts.months}m` : null,
  };
}

function presentationLabel(p: Presentation): string {
  const conc = p.concentration_ml
    ? `${p.concentration_mg} mg/${p.concentration_ml} mL`
    : `${p.concentration_mg} mg`;
  const form = p.form.charAt(0).toUpperCase() + p.form.slice(1);
  return `${form} · ${conc} · ${p.route}`;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-muted px-3 py-2">
      <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-body-lg font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

interface CalculatorWorkspaceProps {
  medication: Medication;
}

function CalculatorWorkspace({ medication }: CalculatorWorkspaceProps) {
  const {
    formData,
    setFormData,
    result,
    loading,
    error,
    calculate,
    resetResult,
  } = useCalculatorForm();

  const [mode, setMode] = useState<Mode>("patient");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [display, setDisplay] = useState<CalculatorFormDisplay>(EMPTY_DISPLAY);
  const [formKey, setFormKey] = useState("manual");

  // seleções do schema rico (indicação/apresentação).
  // Defaults via lazy initializer; o estado é reiniciado ao trocar de
  // medicamento porque a página remonta o workspace com key={medication.id}.
  const regimens = medication.regimens ?? [];
  const presentations = medication.presentations ?? [];
  const [indication, setIndication] = useState<string | null>(
    () => regimens[0]?.indication ?? null,
  );
  const [presentationIndex, setPresentationIndex] = useState<number | null>(
    () => {
      const regimen = regimens[0] ?? null;
      const firstPres = presentations
        .map((p, idx) => ({ p, idx }))
        .find(
          ({ p }) => !regimen?.routes || regimen.routes.includes(p.route),
        );
      return firstPres?.idx ?? null;
    },
  );

  const selectedRegimen =
    regimens.find((r) => r.indication === indication) ?? regimens[0] ?? null;
  // apresentações compatíveis com as vias do regime escolhido (com índice
  // original, pois o backend seleciona por índice na lista do medicamento)
  const presentationOptions = presentations
    .map((p, idx) => ({ p, idx }))
    .filter(
      ({ p }) =>
        !selectedRegimen?.routes || selectedRegimen.routes.includes(p.route),
    );

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, medication_id: medication.id }));
  }, [medication.id, setFormData]);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function switchMode(next: Mode) {
    setMode(next);
    setSelectedPatient(null);
    setDisplay(EMPTY_DISPLAY);
    setFormData({
      weight: null,
      height: null,
      age_days: null,
      medication_id: medication.id,
    });
    setFormKey(`${next}-empty`);
    resetResult();
  }

  // monta os dados (paciente ou manual) com as seleções e recalcula, se houver
  // peso. Usado tanto na seleção de paciente quanto ao trocar indicação/apres.
  function runCalc(nextIndication: string | null, nextPresIdx: number | null) {
    const selections = {
      indication: nextIndication,
      presentation_index: nextPresIdx,
    };
    if (mode === "patient" && selectedPatient) {
      const { data } = derivePatient(selectedPatient, medication.id);
      if (data.weight !== null) calculate({ ...data, ...selections });
    } else if (mode === "manual" && formData.weight !== null) {
      calculate({ ...formData, ...selections });
    }
  }

  function handlePatientSelect(patient: Patient) {
    setSelectedPatient(patient);
    resetResult();
    const { data } = derivePatient(patient, medication.id);
    if (data.weight !== null) {
      calculate({ ...data, indication, presentation_index: presentationIndex });
    }
  }

  function handleIndicationChange(value: string) {
    setIndication(value);
    // a indicação muda as vias permitidas -> recalcula a apresentação padrão
    const regimen = regimens.find((r) => r.indication === value) ?? null;
    const nextPres = presentations
      .map((p, idx) => ({ p, idx }))
      .find(({ p }) => !regimen?.routes || regimen.routes.includes(p.route));
    const nextPresIdx = nextPres?.idx ?? null;
    setPresentationIndex(nextPresIdx);
    runCalc(value, nextPresIdx);
  }

  function handlePresentationChange(value: string) {
    const idx = Number(value);
    setPresentationIndex(idx);
    runCalc(indication, idx);
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    calculate({
      ...formData,
      indication,
      presentation_index: presentationIndex,
    });
  }

  const derived = selectedPatient
    ? derivePatient(selectedPatient, medication.id)
    : null;
  const missingWeight = derived !== null && derived.data.weight === null;

  return (
    <div className="flex flex-col gap-6">
      <CalculatorMedicationInfo medication={medication} />

      <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)}>
        <TabsList className="w-full">
          <TabsTrigger value="patient">A partir de paciente</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
      </Tabs>

      {(regimens.length > 1 || presentationOptions.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {regimens.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
                Indicação
              </span>
              <Select
                value={indication ?? ""}
                onValueChange={handleIndicationChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a indicação" />
                </SelectTrigger>
                <SelectContent>
                  {regimens.map((r) => (
                    <SelectItem key={r.indication} value={r.indication}>
                      {r.indication}
                      {r.off_label ? " (off-label)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {presentationOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
                Apresentação
              </span>
              <Select
                value={presentationIndex?.toString() ?? ""}
                onValueChange={handlePresentationChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a apresentação" />
                </SelectTrigger>
                <SelectContent>
                  {presentationOptions.map(({ p, idx }) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {presentationLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {mode === "patient" && (
        <div className="flex flex-col gap-3">
          <span className="text-body-md font-medium text-foreground">
            Selecione o paciente
          </span>
          <PatientSelector
            selectedId={selectedPatient?.id ?? null}
            onSelect={handlePatientSelect}
          />

          {derived && (
            <div className="grid grid-cols-3 gap-2">
              <SummaryTile label="Peso" value={derived.weightLabel ?? "|"} />
              <SummaryTile label="Altura" value={derived.heightLabel ?? "|"} />
              <SummaryTile label="Idade" value={derived.ageLabel ?? "|"} />
            </div>
          )}

          {missingWeight && (
            <p className="flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-body-md font-medium text-warning">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              Este paciente não tem peso registrado. Cadastre o peso ou use a
              calculadora manual.
            </p>
          )}

          {loading && (
            <p className="flex items-center gap-2 text-body-md text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Calculando dose...
            </p>
          )}
        </div>
      )}

      {result && (
        <div
          ref={resultRef}
          style={{ animation: "fade-in-up 0.35s ease-out" }}
          className="scroll-mt-6"
        >
          <CalculatorResult result={result} />
        </div>
      )}
      {error && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-body-md font-medium text-destructive">
          {error}
        </p>
      )}

      {mode === "manual" && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <CalculatorForm
            key={formKey}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleManualSubmit}
            loading={loading}
            initialDisplay={display}
          />
        </div>
      )}
    </div>
  );
}

export default CalculatorWorkspace;

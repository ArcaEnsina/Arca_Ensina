import { Card, CardContent } from "@/components/ui/card";
import type { Patient } from "@/features/patient";

function getInitials(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "?") + (parts[parts.length - 1]?.[0] ?? "?")).toUpperCase();
}

function calcAge(dataNascimento: string) {
  const birth = new Date(dataNascimento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const GENDER_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  O: "Outro",
};

interface PatientCardProps {
  patient: Patient | null;
}

export function PatientCard({ patient }: PatientCardProps) {
  if (!patient) {
    return (
      <Card size="sm" className="min-h-24">
        <CardContent className="text-muted-foreground text-body-md">
          Nenhum paciente selecionado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="min-h-24">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-arca-blue-600 text-sm font-bold text-white">
          {getInitials(patient.nome)}
        </div>
        <div>
          <p className="text-body-lg font-semibold text-foreground">{patient.nome}</p>
          <p className="text-caption text-muted-foreground">
            {calcAge(patient.dataNascimento)} anos · {GENDER_LABEL[patient.genero] ?? patient.genero}
          </p>
          <p className="text-caption text-muted-foreground">ID {patient.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import type { Patient } from "@/features/patient";
import type { Protocol } from "../../types";
import { Badge } from "@/components/ui/badge";

function getInitials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? '';
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
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

interface ProtocolMiniHeaderProps {
  patient: Patient;
  protocol: Protocol;
}

export function ProtocolMiniHeader({ patient, protocol }: ProtocolMiniHeaderProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {/* Patient mini card */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-arca-blue-600 text-xs font-bold text-white">
          {getInitials(patient.nome ?? '')}
        </div>
        <div>
          <p className="text-body-md font-semibold text-foreground leading-tight">{patient.nome}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {calcAge(patient.dataNascimento)} anos · {GENDER_LABEL[patient.genero] ?? patient.genero}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">ID {patient.id}</p>
        </div>
      </div>

      {/* Protocol mini card */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
        <div>
          <p className="text-body-md font-semibold text-foreground leading-tight">{protocol.name}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{protocol.subtitle}</p>
          <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5">
            {protocol.group}
          </Badge>
        </div>
      </div>
    </div>
  );
}

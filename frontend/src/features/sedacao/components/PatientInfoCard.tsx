import { Card, CardContent } from '@/components/ui/card';
import type { Patient } from '@/features/patient/types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface PatientInfoCardProps {
  patient: Patient;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const initials = getInitials(patient.nome);
  const age = calculateAge(patient.dataNascimento);
  const genderLabel =
    patient.genero === 'M' ? 'Masculino' : patient.genero === 'F' ? 'Feminino' : 'Outro';

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{patient.nome}</p>
          <p className="text-sm text-muted-foreground">
            {age} anos · {genderLabel} · ID {patient.id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Badge } from '@/components/ui/badge';
import type { Patient } from '../types';

interface PatientPillProps {
  patient: Patient;
}

export default function PatientPill({ patient }: PatientPillProps) {
  return (
    <Badge variant="secondary" className="text-sm">
      {patient.nome}
    </Badge>
  );
}

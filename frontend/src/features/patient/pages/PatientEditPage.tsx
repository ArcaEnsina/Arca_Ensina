import { useParams, Link } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';

import PatientForm from '../components/PatientForm';
import { usePatient } from '../api';
import type { PatientCreateInput } from '../schemas';
import type { Patient } from '../types';

function toFormDefaults(p: Patient): Partial<PatientCreateInput> {
  return {
    nome: p.nome ?? '',
    dataNascimento: p.dataNascimento ?? '',
    genero: p.genero ?? 'M',
    nomeResponsavel: p.nomeResponsavel ?? '',
    cidade: p.cidade ?? '',
    telefone: p.telefone ?? '',
    peso: p.peso != null ? String(p.peso) : '',
    altura: p.altura != null ? String(p.altura) : '',
    alergias: p.alergias ?? [],
    sintomas: p.sintomas ?? [],
  };
}

export default function PatientEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading, isError } = usePatient(id ?? null);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          to="/dashboard"
          className="inline-flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 animate-spin" /> Carregando paciente...
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <p className="text-body-lg text-muted-foreground">
              Não foi possível carregar este paciente.
            </p>
          </div>
        )}

        {patient && (
          <PatientForm
            mode="edit"
            patientId={patient.id}
            patientName={patient.nome}
            defaultValues={toFormDefaults(patient)}
          />
        )}
      </div>
    </div>
  );
}

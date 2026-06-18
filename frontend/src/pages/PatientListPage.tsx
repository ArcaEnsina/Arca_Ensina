import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

import { usePatients } from '@/features/patient/api'
import PatientDeleteDialog from '@/features/patient/components/PatientDeleteDialog'
import { Button } from '@/components/ui/button'
import type { Patient } from '@/features/patient/types'

function StatusBadge({ status }: { status: Patient['status'] }) {
  const isAlta = status === 'alta'
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${
        isAlta
          ? 'bg-muted text-muted-foreground'
          : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isAlta ? 'Alta' : 'Ativo'}
    </span>
  )
}

export default function PatientListPage() {
  const navigate = useNavigate()
  const { data: patients = [], isLoading, isError } = usePatients()
  const [toDelete, setToDelete] = useState<Patient | null>(null)

  return (
    <div className="flex flex-col gap-6 px-5 py-4">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-heading-lg">Pacientes</h1>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Erro ao carregar pacientes.
          </p>
        </div>
      )}

      {!isLoading && !isError && patients.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Nenhum paciente cadastrado.
          </p>
          <Button className="mt-2 rounded-full" onClick={() => navigate('/patients')}>
            Cadastrar paciente
          </Button>
        </div>
      )}

      {!isLoading && !isError && patients.length > 0 && (
        <ul className="flex flex-col gap-3">
          {patients.map((patient) => (
            <li
              key={patient.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-body-md font-medium text-foreground">
                    {patient.nome}
                  </p>
                  <StatusBadge status={patient.status} />
                </div>
                <Link
                  to={`/patients/${patient.id}/history`}
                  className="w-fit text-caption text-primary hover:underline"
                >
                  Ver histórico
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Editar ${patient.nome}`}
                  onClick={() => navigate(`/patients/${patient.id}/edit`)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Excluir ${patient.nome}`}
                  onClick={() => setToDelete(patient)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <PatientDeleteDialog
          patientId={toDelete.id}
          patientName={toDelete.nome}
          open={!!toDelete}
          onOpenChange={(open) => {
            if (!open) setToDelete(null)
          }}
        />
      )}
    </div>
  )
}

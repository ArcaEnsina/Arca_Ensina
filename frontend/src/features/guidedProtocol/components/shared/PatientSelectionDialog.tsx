import { useNavigate } from 'react-router'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePatients } from '@/features/patient/api'
import { cn } from '@/lib/utils'
import type { Patient } from '@/features/patient/types'

interface PatientSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolId: string
}

export function PatientSelectionDialog({
  open,
  onOpenChange,
  protocolId,
}: PatientSelectionDialogProps) {
  const navigate = useNavigate()
  const { data: patients = [], isLoading } = usePatients()

  const handleSelectPatient = (patient: Patient) => {
    onOpenChange(false)
    navigate(`/guided-protocol/${protocolId}/step/2?patientId=${patient.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent showCloseButton className="max-w-md">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-title-md font-bold text-foreground">
                Selecionar Paciente
              </h2>
              <p className="mt-1 text-body-sm text-muted-foreground">
                Escolha um paciente para iniciar o protocolo
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-lg bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : patients.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-body-md text-muted-foreground">
                    Nenhum paciente cadastrado
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      navigate('/patients')
                    }}
                  >
                    Adicionar paciente
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left transition-all',
                        'hover:border-primary hover:bg-arca-blue-50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-body-md font-semibold text-foreground">
                          {patient.nome}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {new Date(patient.dataNascimento).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background transition-all group-hover:border-primary">
                        <Check size={14} className="text-transparent" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

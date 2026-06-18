import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { LogOut, Plus, ArrowRight, History, Trash2 } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { usePatients, useSuggestedProtocols } from '@/features/patient/api'
import { usePatientStore } from '@/features/patient/store'
import PatientPill from '@/features/patient/components/PatientPill'
import PatientDeleteDialog from '@/features/patient/components/PatientDeleteDialog'
import { useActiveExecution } from '@/features/guidedProtocol/hooks/useActiveExecution'
import { ActiveProtocolCard } from '@/features/guidedProtocol/components/ActiveProtocolCard'
import { SuggestedProtocolCard } from '@/features/guidedProtocol/components/SuggestedProtocolCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/features/notifications'

const WEEKDAYS = [
  'DOMINGO',
  'SEGUNDA-FEIRA',
  'TERÇA-FEIRA',
  'QUARTA-FEIRA',
  'QUINTA-FEIRA',
  'SEXTA-FEIRA',
  'SÁBADO',
] as const

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom Dia'
  if (h < 18) return 'Boa Tarde'
  return 'Boa Noite'
}

function getDisplayName(user: { first_name: string; last_name: string; gender: string; email: string; profile: string }): string {
  const firstName = user.first_name || user.email
  if (user.profile === 'medico') {
    return user.gender === 'feminino' ? `Dra. ${firstName}` : `Dr. ${firstName}`
  }
  return firstName
}

const GENDER_LABELS: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' }

function formatAge(dataNascimento: string): string {
  const birth = new Date(dataNascimento)
  const now = new Date()
  const years = Math.floor(
    (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  )
  if (years < 1) {
    const months = Math.floor(
      (now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000),
    )
    return `${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: allPatients = [], isLoading } = usePatients()
  // O dashboard lista e conta apenas os pacientes ativos (não dados de alta).
  const patients = allPatients.filter((p) => p.status !== 'alta')
  const setActivePatient = usePatientStore((s) => s.setActivePatient)
  const activePatient = usePatientStore((s) => s.activePatient)
  const clearPatient = usePatientStore((s) => s.clearPatient)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: activeExecution } = useActiveExecution(activePatient?.id ?? null)
  const {
    data: suggestions = [],
    isLoading: suggLoading,
    isError: suggError,
  } = useSuggestedProtocols(activePatient?.id ?? null)

  const now = new Date()
  const weekday = WEEKDAYS[now.getDay()]
  const dateStr = `${now.getDate()} de ${MONTHS[now.getMonth()]}`

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex w-full flex-col gap-6 px-5 tablet:gap-10 tablet:px-10">
      {/* ── Greeting + actions row ── */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-caption font-medium tracking-widest text-muted-foreground tablet:text-body-md">
            {weekday}
          </span>
          <h1 className="text-display-sm leading-tight tablet:text-display-lg">
            {getGreeting()},
            <br />
            <span className="text-primary">
              {user ? getDisplayName(user) : ''}
            </span>
          </h1>
          <p className="mt-1 text-body-md text-muted-foreground tablet:text-body-lg">
            {dateStr}
            <span className="mx-1.5">•</span>
            {isLoading ? '…' : `${patients.length} ${patients.length === 1 ? 'paciente ativo' : 'pacientes ativos'}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-4 tablet:gap-3 tablet:pt-6">
          <NotificationBell className="tablet:hidden" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex size-11 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 tablet:size-12"
            aria-label="Sair"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* ── Patients row ── */}
      <section>
        <div className="mb-3 flex items-center justify-between tablet:mb-5">
          <span className="text-caption font-medium tracking-widest text-muted-foreground tablet:text-body-md">
            PACIENTES
          </span>
          <Link
            to="/patients/list"
            className="inline-flex items-center gap-1 text-body-md font-medium text-primary transition-colors hover:text-primary/80 tablet:text-body-lg"
          >
            Ver todos
            <ArrowRight size={14} className="tablet:size-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none tablet:gap-4">
          {/* Add patient pill */}
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className={cn(
              'inline-flex min-w-36 max-w-48 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border px-3.5 py-3',
              'cursor-pointer transition-all hover:border-primary hover:bg-arca-blue-50',
              'outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
              'tablet:min-w-44 tablet:max-w-56 tablet:px-5 tablet:py-4',
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary tablet:size-9">
              <Plus size={16} className="tablet:size-5" />
            </span>
            <span className="text-caption font-medium text-muted-foreground tablet:text-body-md">
              Adicionar
            </span>
          </button>

          {/* Patient pills */}
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-36 max-w-48 shrink-0 animate-pulse rounded-2xl border border-border bg-muted px-3.5 py-3 tablet:min-w-44 tablet:max-w-56 tablet:px-5 tablet:py-4"
                >
                  <div className="mb-1.5 h-4 w-24 rounded bg-neutral-300 tablet:h-5 tablet:w-28" />
                  <div className="h-3 w-16 rounded bg-neutral-200 tablet:h-4 tablet:w-20" />
                </div>
              ))
            : patients.map((patient) => (
                <div key={patient.id} className="shrink-0">
                  <div className="tablet:hidden">
                    <PatientPill
                      patient={patient}
                      active={patient.id === activePatient?.id}
                      onClick={() => {
                        setActivePatient(patient);
                      }}
                    />
                  </div>
                  <div className="hidden tablet:block">
                    <PatientPill
                      patient={patient}
                      size="lg"
                      active={patient.id === activePatient?.id}
                      onClick={() => {
                        setActivePatient(patient);
                      }}
                    />
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* ── Selected patient ── */}
      <section>
        <div className="mb-3 flex items-center justify-between tablet:mb-5">
          <span className="text-caption font-medium tracking-widest text-muted-foreground tablet:text-body-md">
            PACIENTE SELECIONADO
          </span>
          {activePatient ? (
            <Link
              to={`/patients/${activePatient.id}/edit`}
              className="inline-flex items-center gap-1 text-body-md font-medium text-primary transition-colors hover:text-primary/80 tablet:text-body-lg"
            >
              Editar Dados
              <ArrowRight size={14} className="tablet:size-4" />
            </Link>
          ) : null}
        </div>

        {activePatient ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 tablet:p-6">
            <h2 className="text-heading-lg font-semibold text-foreground">
              {activePatient.nome}
            </h2>
            <p className="text-body-md text-muted-foreground mt-1">
              {formatAge(activePatient.dataNascimento)}
              <span className="mx-1.5">•</span>
              {GENDER_LABELS[activePatient.genero] ?? activePatient.genero}
              <span className="mx-1.5">•</span>
              {activePatient.peso} kg
            </p>
            <div className="my-4 border-t border-border tablet:my-5" />
            <div className="flex flex-col gap-2 tablet:flex-row">
              <Button variant="outline" size="lg" className="w-full rounded-full" asChild>
                <Link to={`/patients/${activePatient.id}/history`} className="inline-flex items-center justify-center gap-2">
                  <History size={18} />
                  Ver histórico de protocolos
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="w-full rounded-full tablet:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={18} />
                Excluir
              </Button>
            </div>
            <PatientDeleteDialog
              patientId={activePatient.id}
              patientName={activePatient.nome}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              onDeleted={clearPatient}
            />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 tablet:p-6 flex flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="text-body-lg text-muted-foreground">
              Nenhum paciente selecionado
            </p>
            <p className="text-body-md text-muted-foreground/70">
              Toque em um paciente acima para selecionar
            </p>
          </div>
        )}
      </section>

      {/* ── Protocol: in-progress execution (selected patient) or suggestion ── */}
      <section className="mt-6 tablet:mt-8">
        <div className="mb-3 tablet:mb-5">
          <span className="text-caption font-medium tracking-widest text-muted-foreground tablet:text-body-md">
            {activeExecution ? 'PROTOCOLO EM EXECUÇÃO' : 'PROTOCOLO RECOMENDADO'}
          </span>
        </div>

        {activeExecution ? (
          <ActiveProtocolCard data={activeExecution} />
        ) : (
          <SuggestedProtocolCard
            suggestions={suggestions}
            isLoading={suggLoading}
            isError={suggError}
            hasPatient={!!activePatient}
          />
        )}
      </section>
    </div>
  )
}

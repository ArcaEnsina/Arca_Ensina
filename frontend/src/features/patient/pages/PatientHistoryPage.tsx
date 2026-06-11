import { useParams, Link } from 'react-router'
import { ArrowLeft, BookOpen, Syringe } from 'lucide-react'
import { usePatientHistory, useSuggestedProtocols } from '@/features/patient/api'
import ProtocolSuggestionCard from '@/features/patient/components/ProtocolSuggestionCard'
import type { ProtocolHistoryEvent } from '@/features/patient/types'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} \u2022 ${hh}:${min}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    concluido: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    em_andamento: 'bg-blue-100 text-blue-700',
    abandonado: 'bg-red-100 text-red-700',
  }
  const label: Record<string, string> = {
    concluido: 'Concluído',
    completed: 'Concluído',
    em_andamento: 'Em andamento',
    abandonado: 'Abandonado',
  }
  const cls = map[status] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-caption font-medium ${cls}`}>
      {label[status] ?? status}
    </span>
  )
}

function EventCard({ event }: { event: ProtocolHistoryEvent }) {
  const isProtocol = event.type === 'guided_protocol'
  const Icon = isProtocol ? BookOpen : Syringe

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 items-start">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-body-md font-medium text-foreground truncate">
            {event.title}
          </p>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-caption text-muted-foreground">
          {formatTimestamp(event.timestamp)}
        </p>
        {isProtocol && event.protocolVersion ? (
          <p className="text-body-sm text-muted-foreground">
            Versão: {event.protocolVersion}
          </p>
        ) : null}
        {!isProtocol ? (
          <p className="text-body-sm text-muted-foreground">
            {String(event.details.convertedDose ?? '')}{' '}
            {String(event.details.unit ?? '')}{' '}
            {String(event.details.frequency ?? '')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-3 items-start animate-pulse">
      <div className="size-10 shrink-0 rounded-full bg-muted" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted/70" />
        <div className="h-3 w-1/2 rounded bg-muted/70" />
      </div>
    </div>
  )
}

export default function PatientHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const { data: events = [], isLoading, isError } = usePatientHistory(id ?? null)
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions,
    isError: isSuggestionsError,
  } = useSuggestedProtocols(id ?? null)

  return (
    <div className="flex flex-col gap-6 px-5 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-heading-lg">Histórico de Protocolos</h1>
      </div>

      <ProtocolSuggestionCard
        suggestions={suggestions}
        isLoading={isLoadingSuggestions}
        isError={isSuggestionsError}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Erro ao carregar histórico.
          </p>
          <p className="text-body-md text-muted-foreground/70">
            Tente novamente mais tarde.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && events.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Nenhum histórico encontrado para este paciente.
          </p>
          <p className="text-body-md text-muted-foreground/70">
            As execuções de protocolo e conversões de sedação aparecerão aqui.
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && !isError && events.length > 0 && (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

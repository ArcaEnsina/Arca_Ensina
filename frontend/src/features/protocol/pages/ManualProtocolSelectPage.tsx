import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export default function ManualProtocolSelectPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-4">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-heading-lg">Catálogo de Protocolos</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-body-lg text-muted-foreground">
          Seleção manual de protocolos estará disponível em breve.
        </p>
        <p className="text-body-md text-muted-foreground/70">
          Você poderá buscar e selecionar protocolos do catálogo clínico.
        </p>
      </div>
    </div>
  )
}

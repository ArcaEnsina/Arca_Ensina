import { useState } from 'react'
import { Download, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DownloadState = 'idle' | 'downloading' | 'downloaded' | 'error'

interface DownloadOfflineButtonProps {
  onDownload: () => Promise<void>
  initialCached?: boolean
  className?: string
}

export function DownloadOfflineButton({
  onDownload,
  initialCached = false,
  className,
}: DownloadOfflineButtonProps) {
  // Estado transitório da ação do usuário (clique). Quando ausente, o estado
  // exibido é derivado de initialCached — que chega de forma assíncrona
  // (IndexedDB) e pode mudar depois do mount (ex.: auto-update da versão
  // baixada). Derivar no render evita sincronizar via setState em efeito.
  const [action, setAction] = useState<DownloadState | null>(null)
  const state: DownloadState = action ?? (initialCached ? 'downloaded' : 'idle')

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (state === 'downloading' || state === 'downloaded') return
    setAction('downloading')
    try {
      await onDownload()
      setAction('downloaded')
    } catch {
      setAction('error')
    }
  }

  const icons = {
    idle: <Download size={14} />,
    downloading: <Loader2 size={14} className="animate-spin" />,
    downloaded: <Check size={14} />,
    error: <X size={14} />,
  }

  const labels = {
    idle: 'Baixar para uso offline',
    downloading: 'Baixando...',
    downloaded: 'Salvo no aparelho',
    error: 'Erro ao baixar',
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleClick}
      aria-label={labels[state]}
      className={cn(
        'h-7 w-7 rounded-full p-0',
        state === 'idle' && 'text-muted-foreground hover:text-foreground',
        state === 'downloading' && 'text-arca-blue-600',
        state === 'downloaded' && 'text-success',
        state === 'error' && 'text-danger',
        className,
      )}
    >
      {icons[state]}
    </Button>
  )
}

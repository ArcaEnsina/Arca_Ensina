import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDownloadProtocol } from '../api'
import type { ProtocolListItem } from '../types'

interface ProtocolPreviewSheetProps {
  protocol: ProtocolListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: () => void
}

export default function ProtocolPreviewSheet({
  protocol,
  open,
  onOpenChange,
  onStart,
}: ProtocolPreviewSheetProps) {
  const download = useDownloadProtocol()

  if (!protocol) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{protocol.title}</span>
            {protocol.current_version_type && (
              <Badge
                variant={
                  protocol.current_version_type === 'guiado'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {protocol.current_version_type === 'guiado'
                  ? 'Guiado'
                  : 'Painel'}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {protocol.specialty} — {protocol.author}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="text-body-md">
            <span className="font-medium text-foreground">CID: </span>
            <span className="text-muted-foreground">{protocol.cid}</span>
          </div>

          {protocol.tags.length > 0 && (
            <div className="text-body-md">
              <span className="font-medium text-foreground">Tags: </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {protocol.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {protocol.gender_applicable && (
            <div className="text-body-md">
              <span className="font-medium text-foreground">Gênero: </span>
              <span className="text-muted-foreground">
                {protocol.gender_applicable === 'M'
                  ? 'Masculino'
                  : 'Feminino'}
              </span>
            </div>
          )}

          {(protocol.age_range_min != null || protocol.age_range_max != null) && (
            <div className="text-body-md">
              <span className="font-medium text-foreground">Idade: </span>
              <span className="text-muted-foreground">
                {protocol.age_range_min != null ? `${protocol.age_range_min} meses` : ''}
                {protocol.age_range_min != null && protocol.age_range_max != null ? ' – ' : ''}
                {protocol.age_range_max != null ? `${protocol.age_range_max} meses` : ''}
              </span>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-full"
            disabled={download.isPending}
            onClick={() => download.mutate(protocol.id)}
          >
            {download.isPending ? 'Baixando...' : 'Baixar para offline'}
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-full rounded-full"
            onClick={onStart}
          >
            Iniciar execução
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

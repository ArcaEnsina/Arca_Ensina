import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ProtocolListItem } from '../types'

interface ProtocolCatalogCardProps {
  protocol: ProtocolListItem
  onPreview: () => void
  onStart: () => void
}

export default function ProtocolCatalogCard({
  protocol,
  onPreview,
  onStart,
}: ProtocolCatalogCardProps) {
  return (
    <Card size="sm" className="shadow-sm transition-shadow hover:shadow-md">
      <div
        onClick={onPreview}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onPreview()
        }}
        aria-label={`Visualizar ${protocol.title}`}
        className="cursor-pointer"
      >
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
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
            <Badge variant="outline">{protocol.specialty}</Badge>
          </div>
          <CardTitle className="text-heading-lg font-semibold text-foreground">
            {protocol.title}
          </CardTitle>
          <CardDescription className="text-body-md text-muted-foreground">
            {protocol.author} — {protocol.cid}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocol.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {protocol.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-caption"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="min-h-11"
        >
          Visualizar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onStart}
          className="min-h-11"
        >
          Iniciar
        </Button>
      </CardFooter>
    </Card>
  )
}

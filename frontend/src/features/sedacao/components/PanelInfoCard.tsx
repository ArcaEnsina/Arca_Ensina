import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PanelInfoCardProps {
  panelName: string;
  panelType: string;
  version?: string;
}

export function PanelInfoCard({ panelName, panelType, version }: PanelInfoCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-semibold">{panelName}</p>
            <Badge variant="secondary">{panelType}</Badge>
          </div>
          {version && (
            <p className="mt-1 text-xs text-muted-foreground">v{version}</p>
          )}
        </div>
        <Button variant="ghost" size="sm">
          Trocar Protocolo
        </Button>
      </CardContent>
    </Card>
  );
}

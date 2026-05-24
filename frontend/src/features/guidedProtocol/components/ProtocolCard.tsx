import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Protocol } from "../types";

interface ProtocolCardProps {
  protocol: Protocol;
  onSwap?: () => void;
}

export function ProtocolCard({ protocol, onSwap }: ProtocolCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <Card size="sm" className="py-2">
        <CardContent className="flex flex-col gap-1">
          <p className="text-body-lg font-semibold text-foreground">{protocol.name}</p>
          <p className="text-[11px] text-muted-foreground">{protocol.subtitle}</p>
          <Badge variant="outline" className="w-fit text-[10px] h-4 px-1.5">
            {protocol.group}
          </Badge>
        </CardContent>
      </Card>
      <Button size="sm" variant="default" className="w-fit" onClick={onSwap}>
        Trocar Protocolo
      </Button>
    </div>
  );
}

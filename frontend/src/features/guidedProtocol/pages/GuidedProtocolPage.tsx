import { useNavigate } from 'react-router';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuidedProtocols } from '../api';
import { useGuidedProtocolStore } from '../store';

export default function GuidedProtocolPage() {
  const navigate = useNavigate();
  const { data: protocols = [], isLoading, isError } = useGuidedProtocols();
  const reset = useGuidedProtocolStore((s) => s.reset);
  const setProtocolId = useGuidedProtocolStore((s) => s.setProtocolId);

  function start(id: number) {
    // Fresh execution state for the picked protocol.
    reset();
    setProtocolId(id);
    navigate(`/guided-protocol/${id}`);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-display-md text-arca-blue-900">Protocolos Guiados</h1>
        <p className="text-body-md text-muted-foreground">
          Selecione um protocolo para iniciar a execução interativa.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-body-md text-muted-foreground">
          Não foi possível carregar os protocolos. Tente novamente.
        </p>
      )}

      {!isLoading && !isError && protocols.length === 0 && (
        <p className="text-body-md text-muted-foreground">
          Nenhum protocolo guiado disponível.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {protocols.map((protocol) => (
          <Card key={protocol.id}>
            <CardContent className="flex items-center gap-4">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-arca-blue-50 text-arca-blue-700"
                aria-hidden="true"
              >
                <Stethoscope className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-lg font-semibold text-arca-blue-900">
                  {protocol.title}
                </p>
                <p className="truncate text-body-sm text-muted-foreground">
                  {protocol.specialty ?? protocol.cid ?? 'Protocolo guiado'}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 gap-1.5 rounded-2xl"
                onClick={() => start(protocol.id)}
              >
                Iniciar
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

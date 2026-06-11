import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProtocolSuggestion } from '../types';

interface ProtocolSuggestionCardProps {
  suggestions?: ProtocolSuggestion[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function ProtocolSuggestionCard({
  suggestions = [],
  isLoading = false,
  isError = false,
}: ProtocolSuggestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Sugestões de Protocolo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted/70" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar sugestões para este paciente.
          </p>
        )}

        {!isLoading && !isError && suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sugestões de protocolo aparecerão aqui após o cadastro do paciente.
          </p>
        )}

        {!isLoading && !isError && suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <article
                key={suggestion.id}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {suggestion.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.specialty || 'Sem especialidade'}
                      {suggestion.cid ? ` · CID ${suggestion.cid}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {suggestion.score}
                  </Badge>
                </div>

                {suggestion.matchedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion.matchedSymptoms.map((symptom) => (
                      <Badge key={symptom} variant="outline" className="text-[11px]">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

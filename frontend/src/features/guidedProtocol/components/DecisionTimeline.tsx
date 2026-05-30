import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuidedProtocolStore } from '../store';
import type { HistoryEntry } from '../types';

function summarize(entry: HistoryEntry): string {
  const v = entry.values;
  switch (entry.stepType) {
    case 'yes_no':
      return v.answer === true ? 'Sim' : v.answer === false ? 'Não' : '';
    case 'titration_loop':
      return v.congestion === true ? 'Congestão: sim' : v.congestion === false ? 'Congestão: não' : '';
    case 'multiple_choice':
      return typeof v.choice === 'string' ? v.choice : '';
    case 'checklist': {
      const items = Array.isArray(v.checkedItems) ? v.checkedItems : [];
      return items.length ? `${items.length} marcado(s)` : 'Nenhum marcado';
    }
    case 'numeric_input': {
      const entries = Object.entries(v);
      return entries.length ? entries.map(([k, val]) => `${k}: ${String(val)}`).join(', ') : '';
    }
    default:
      return 'Visto';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function DecisionTimeline() {
  const history = useGuidedProtocolStore((s) => s.history);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (history.length === 0) return null;

  return (
    <nav aria-label="Linha do tempo de decisões" className="flex flex-col gap-1">
      <h2 className="text-body-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Decisões
      </h2>
      <ol className="flex flex-col">
        {history.map((entry, idx) => {
          const isOpen = expanded === entry.stepKey;
          const summary = summarize(entry);
          return (
            <li key={`${entry.stepKey}-${idx}`} className="relative flex gap-3 pb-3">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="size-4 text-blue-700" aria-hidden="true" />
                {idx < history.length - 1 && (
                  <span className="mt-0.5 w-0.5 flex-1 bg-blue-200" aria-hidden="true" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : entry.stepKey)}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-blue-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200',
                )}
                aria-expanded={isOpen}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-body-sm font-medium text-blue-900">
                    {entry.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatTime(entry.answeredAt)}
                  </span>
                </span>
                {summary && (
                  <span className="block text-body-sm text-muted-foreground">
                    {summary}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

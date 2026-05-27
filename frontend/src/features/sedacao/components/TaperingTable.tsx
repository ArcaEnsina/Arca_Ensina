import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaperingDay } from '../types';

interface TaperingTableProps {
  schedule: TaperingDay[];
  onToggleApplied: (day: number) => void;
}

export function TaperingTable({ schedule, onToggleApplied }: TaperingTableProps) {
  const firstUnapplied = schedule.find((d) => !d.applied);
  const allApplied = schedule.every((d) => d.applied);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Cronograma de Desmame</h3>

      <ul className="space-y-2">
        {schedule.map((day) => {
          const isCurrent = day.day === firstUnapplied?.day;
          return (
            <li key={day.day}>
              <div
                className={cn(
                  'flex items-center justify-between gap-4 rounded-lg border p-4',
                  isCurrent && 'bg-blue-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Dia {day.day}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums">
                    {day.dose}
                  </span>
                  <Badge variant={day.applied ? 'default' : 'secondary'}>
                    {day.applied ? 'Aplicada' : 'Pendente'}
                  </Badge>
                </div>
                <Button
                  variant={day.applied ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() => onToggleApplied(day.day)}
                  aria-label={day.applied ? `Desmarcar dia ${day.day}` : `Marcar dia ${day.day} como aplicada`}
                >
                  {day.applied ? 'Desmarcar' : 'Marcar aplicada'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm">
        {allApplied ? (
          <span className="font-medium text-green-700">Desmame concluído</span>
        ) : (
          <span className="text-muted-foreground">
            Em andamento — {schedule.filter((d) => d.applied).length} de{' '}
            {schedule.length} dias aplicados
          </span>
        )}
      </div>
    </div>
  );
}

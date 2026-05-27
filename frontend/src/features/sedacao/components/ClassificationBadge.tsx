import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check } from 'lucide-react';
import type { PanelCalculationResult } from '../types';

interface ClassificationBadgeProps {
  result: PanelCalculationResult;
  selectedDose?: 'calculated' | 'recommended';
  onSelectDose?: (choice: 'calculated' | 'recommended') => void;
}

const statusConfig = {
  within_range: {
    label: 'Dentro do intervalo seguro',
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: null,
  },
  above_max: {
    label: 'Acima do máximo recomendado',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertTriangle,
  },
  below_min: {
    label: 'Abaixo do mínimo recomendado',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle,
  },
} as const;

export function ClassificationBadge({
  result,
  selectedDose,
  onSelectDose,
}: ClassificationBadgeProps) {
  const hasWarnings = result.warnings.length > 0;
  const firstWarning = result.warnings[0];

  // Determine status from warnings
  const status = hasWarnings
    ? firstWarning.type === 'above_max_recommended'
      ? 'above_max'
      : 'below_min'
    : 'within_range';

  const config = statusConfig[status];
  const Icon = config.icon;
  const isAlert = status !== 'within_range';
  const showChoices = hasWarnings && onSelectDose;

  return (
    <div
      className={cn('rounded-lg border p-4 space-y-3', config.bg, config.border, config.text)}
      role={isAlert ? 'alert' : undefined}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className="size-5 shrink-0 mt-1" aria-hidden="true" />}
        <div className="flex-1 space-y-1">
          {/* Primary: dose per administration */}
          <p className="font-mono text-3xl font-bold tabular-nums">
            {result.perDose.value} {result.perDose.unit}
          </p>

          {/* Frequency pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium">
            <span>{result.dosesPerDay}x ao dia</span>
            <span className="opacity-50">&middot;</span>
            <span className="opacity-75">{result.frequency}</span>
          </div>

          {/* Secondary: total 24h */}
          <p className="text-sm text-muted-foreground">
            Total: {result.totalDaily.value} {result.totalDaily.unit}
          </p>

          {/* Status label */}
          <p className="text-sm font-medium">{config.label}</p>

          {/* Recommended dose when warnings present */}
          {hasWarnings && (
            <p className="text-xs opacity-75">
              Recomendada: {result.recommended.value} {result.recommended.unit}
            </p>
          )}

          {/* Warning message */}
          {firstWarning && (
            <p className="text-xs opacity-75">{firstWarning.message}</p>
          )}

          <p className="text-xs opacity-60">{result.formulaApplied}</p>
        </div>
      </div>

      {showChoices && (
        <div className="space-y-2 pt-2 border-t border-red-200/50">
          <p className="text-sm font-medium">Selecione a dose para prescrição:</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={selectedDose === 'calculated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectDose('calculated')}
              className={cn(
                'justify-start gap-2',
                selectedDose === 'calculated' && 'bg-red-700 hover:bg-red-800',
              )}
            >
              {selectedDose === 'calculated' && <Check className="size-4" />}
              <div className="flex flex-col items-start text-left">
                <span>Calculada</span>
                <span className="text-xs opacity-75">{result.perDose.value} {result.perDose.unit}</span>
              </div>
            </Button>
            <Button
              type="button"
              variant={selectedDose === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectDose('recommended')}
              className={cn(
                'justify-start gap-2',
                selectedDose === 'recommended' && 'bg-blue-700 hover:bg-blue-800',
              )}
            >
              {selectedDose === 'recommended' && <Check className="size-4" />}
              <div className="flex flex-col items-start text-left">
                <span>Recomendada</span>
                <span className="text-xs opacity-75">{result.recommended.value} {result.recommended.unit}</span>
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

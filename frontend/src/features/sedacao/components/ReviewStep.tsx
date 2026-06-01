import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSedationStore } from '../store';
import { getDrugById } from '../api';

interface ReviewStepProps {
  onBack: () => void;
  onFinish: () => void;
  finishing: boolean;
}

// RASS scale scores
const RASS_SCORES = [
  { value: '+4', label: 'Combativo', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: '+3', label: 'Muito agitado', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: '+2', label: 'Agitado', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: '+1', label: 'Inquieto', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: '0', label: 'Alerta e calmo', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: '-1', label: 'Sonolento', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: '-2', label: 'Sedação leve', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: '-3', label: 'Sedação moderada', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: '-4', label: 'Sedação profunda', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { value: '-5', label: 'Não desperta', color: 'bg-gray-200 text-gray-700 border-gray-300' },
];

// SOS checklist items
const SOS_ITEMS = [
  { id: 'tremor', label: 'Tremor' },
  { id: 'agitacao', label: 'Agitação' },
  { id: 'sudorese', label: 'Sudorese' },
  { id: 'febre', label: 'Febre' },
  { id: 'taquicardia', label: 'Taquicardia' },
  { id: 'hipertensao', label: 'Hipertensão' },
  { id: 'mialgia', label: 'Mialgia' },
  { id: 'diarreia', label: 'Diarréia' },
];

export function ReviewStep({ onBack, onFinish, finishing }: ReviewStepProps) {
  const { sourceDrugId } = useSedationStore();
  const sourceDrug = sourceDrugId ? getDrugById(sourceDrugId) : undefined;
  const isRass = sourceDrug?.scaleType === 'RASS';
  const [selectedRass, setSelectedRass] = useState<string | null>(null);
  const [sosChecks, setSosChecks] = useState<Record<string, boolean>>({});

  const toggleSos = (id: string) => {
    setSosChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Reavaliação card */}
      <div className="rounded-4xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Clock className="size-5 text-blue-700" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Reavaliação</h3>
            <p className="text-xs text-muted-foreground">30 min após a intervenção</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Evolução</span>
            <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Estável
            </Badge>
          </div>

          <RecheckRow icon={<ShieldCheck className="size-4 text-gray-400" />} label="Sinais vitais" status="Estável" />
          <RecheckRow icon={<ShieldCheck className="size-4 text-gray-400" />} label="Estado de perfusão" status="Normal" />
          <RecheckRow icon={<ShieldCheck className="size-4 text-gray-400" />} label="Diurese" status="Presente" />
          <RecheckRow icon={<ShieldCheck className="size-4 text-gray-400" />} label="Hematócrito" status="Estável" />
        </div>
      </div>

      {/* Scale card */}
      <div className="rounded-4xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">
          {isRass ? 'Escala RASS — Sedação' : 'Escala SOS — Abstinência'}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isRass ? 'Alvo: 0 a -2' : 'Threshold ≥ 4'}
        </p>

        {isRass ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {RASS_SCORES.map((score) => (
              <button
                key={score.value}
                type="button"
                onClick={() => setSelectedRass(score.value)}
                className={cn(
                  'flex size-11 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2',
                  score.color,
                  selectedRass === score.value
                    ? 'ring-2 ring-blue-700 ring-offset-2'
                    : 'opacity-80 hover:opacity-100',
                )}
                aria-label={`RASS ${score.value}: ${score.label}`}
              >
                {score.value}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {SOS_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={!!sosChecks[item.id]}
                  onChange={() => toggleSos(item.id)}
                  className="size-5 rounded border-gray-300 text-blue-700 focus:ring-blue-700"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white/95 py-4 backdrop-blur-sm">
        <Button variant="ghost" size="lg" onClick={onBack} className="gap-1">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button size="lg" onClick={onFinish} disabled={finishing}>
          {finishing ? 'Finalizando...' : 'Finalizar atendimento'}
        </Button>
      </div>
    </div>
  );
}

function RecheckRow({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-green-700">{status}</span>
    </div>
  );
}

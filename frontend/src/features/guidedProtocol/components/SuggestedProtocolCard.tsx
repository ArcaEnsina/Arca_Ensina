import { Link, useNavigate } from 'react-router';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProtocolSuggestion } from '@/features/patient/types';

interface SuggestedProtocolCardProps {
  suggestions?: ProtocolSuggestion[];
  isLoading?: boolean;
  isError?: boolean;
  hasPatient?: boolean;
}

/** Botão secundário (link) que leva ao catálogo de seleção manual. */
function ManualSelectButton() {
  return (
    <Button
      variant="default"
      size="lg"
      className="w-full bg-white text-neutral-900 hover:bg-neutral-100 rounded-full"
      asChild
    >
      <Link
        to="/protocols/manual"
        className="inline-flex items-center justify-center gap-2"
      >
        <BookOpen size={18} />
        Selecionar protocolo manualmente
      </Link>
    </Button>
  );
}

/**
 * Card de "PROTOCOLO RECOMENDADO" no Dashboard (mostrado quando o paciente
 * selecionado NÃO tem execução em andamento). Exibe a melhor sugestão do
 * algoritmo e permite iniciá-la, ou cair para a seleção manual quando não há
 * paciente/sintomas/sugestão. Mantém o estilo escuro do ActiveProtocolCard.
 */
export function SuggestedProtocolCard({
  suggestions = [],
  isLoading = false,
  isError = false,
  hasPatient = false,
}: SuggestedProtocolCardProps) {
  const navigate = useNavigate();
  const top = suggestions[0];

  const handleStart = () => {
    if (!top) return;
    if (top.type === 'painel') {
      navigate('/sedation');
    } else {
      navigate(`/guided-protocol/${top.id}`);
    }
  };

  // Estado de carregamento (paciente selecionado, buscando sugestões).
  if (hasPatient && isLoading) {
    return (
      <div className="bg-neutral-900 rounded-2xl shadow-md p-5 tablet:p-6 text-white">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-700" />
        <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-neutral-700" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
        <div className="mt-5 h-11 w-full animate-pulse rounded-full bg-neutral-800" />
      </div>
    );
  }

  // Sem paciente, erro ou nenhuma sugestão → só a seleção manual.
  if (!hasPatient || isError || !top) {
    const message = !hasPatient
      ? 'Selecione um paciente para receber uma sugestão automática de protocolo.'
      : isError
        ? 'Não foi possível carregar a sugestão automática. Selecione um protocolo manualmente.'
        : 'Nenhuma sugestão automática para os sintomas deste paciente. Selecione um protocolo manualmente.';

    return (
      <div className="bg-neutral-900 rounded-2xl shadow-md p-5 tablet:p-6 text-white">
        <span className="text-caption font-medium tracking-widest text-neutral-400 uppercase">
          Sugestão baseada em sintomas
        </span>
        <p className="text-body-md text-neutral-400 mt-2">{message}</p>
        <div className="mt-5 flex">
          <ManualSelectButton />
        </div>
      </div>
    );
  }

  // Melhor sugestão disponível.
  return (
    <div className="bg-neutral-900 rounded-2xl shadow-md p-5 tablet:p-6 text-white">
      <span className="inline-flex items-center gap-2 text-caption font-medium tracking-widest text-neutral-400 uppercase">
        <Sparkles size={14} className="text-arca-blue-300" />
        Sugestão baseada em sintomas
      </span>
      <h2 className="text-heading-lg font-semibold text-white mt-2">
        {top.title}
      </h2>
      <p className="text-body-md text-neutral-400 mt-1">
        {top.specialty || 'Sem especialidade'}
        {top.cid ? ` · CID ${top.cid}` : ''}
      </p>

      {top.matchedSymptoms.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {top.matchedSymptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-neutral-200"
            >
              {symptom}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          variant="default"
          size="lg"
          className="w-full bg-white text-neutral-900 hover:bg-neutral-100 rounded-full"
          onClick={handleStart}
        >
          <span className="inline-flex items-center justify-center gap-2">
            Iniciar protocolo sugerido
            <ArrowRight size={18} />
          </span>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full rounded-full text-neutral-300 hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link
            to="/protocols/manual"
            className="inline-flex items-center justify-center gap-2"
          >
            <BookOpen size={18} />
            Selecionar manualmente
          </Link>
        </Button>
      </div>
    </div>
  );
}

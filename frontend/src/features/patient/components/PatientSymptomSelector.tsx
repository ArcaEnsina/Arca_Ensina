import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSymptoms } from '../api';
import { useSymptomSearch } from '../hooks/use-symptom-search';

interface PatientSymptomSelectorProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export default function PatientSymptomSelector({
  value,
  onChange,
}: PatientSymptomSelectorProps) {
  const { data: symptomsData } = useSymptoms();
  const availableSymptoms = symptomsData?.map((s) => s.descricao) ?? [];

  const {
    searchTerm,
    setSearchTerm,
    filtered,
    canAddCustom,
    customTerm,
  } = useSymptomSearch(availableSymptoms);

  const toggle = (s: string) => {
    onChange(
      value.includes(s) ? value.filter((x) => x !== s) : [...value, s],
    );
  };

  const remove = (s: string) => {
    onChange(value.filter((x) => x !== s));
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="sintoma-search"
        className="text-xs font-bold text-arca-blue-700 uppercase tracking-wider"
      >
        Sintomas Atuais
      </label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          id="sintoma-search"
          className="pl-10"
          placeholder="Pesquisar ou digitar novo sintoma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              value.includes(s)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-card-foreground border-border hover:border-primary/50'
            }`}
          >
            {s}
          </button>
        ))}

        {canAddCustom && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => {
              toggle(customTerm);
              setSearchTerm('');
            }}
          >
            <Plus className="mr-1 size-3" />
            Adicionar &quot;{customTerm}&quot;
          </Button>
        )}
      </div>

      {availableSymptoms.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum sintoma disponível. Digite para adicionar sintomas
          personalizados.
        </p>
      )}

      {value.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
            Selecionados:
          </p>
          <div className="flex flex-wrap gap-2">
            {value.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="bg-muted flex items-center gap-1"
              >
                {s}
                <button
                  type="button"
                  className="ml-1 cursor-pointer hover:text-destructive"
                  aria-label={`Remover sintoma ${s}`}
                  onClick={() => remove(s)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

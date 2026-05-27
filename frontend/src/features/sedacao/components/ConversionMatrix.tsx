import type { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, AlertCircle } from 'lucide-react';
import type { SedationFormData } from '../schemas';
import type { PanelDrugOption, PanelCalculationResult } from '../types';
import { ClassificationBadge } from './ClassificationBadge';

interface ConversionMatrixProps {
  form: UseFormReturn<SedationFormData>;
  drugOptions: PanelDrugOption[];
  drugError?: Error | null;
  result: PanelCalculationResult | null;
  loading: boolean;
  onCalculate: () => void;
  selectedDose?: 'calculated' | 'recommended';
  onSelectDose?: (choice: 'calculated' | 'recommended') => void;
}

export function ConversionMatrix({
  form,
  drugOptions,
  drugError,
  result,
  loading,
  onCalculate,
  selectedDose,
  onSelectDose,
}: ConversionMatrixProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const sourceDrugId = watch('sourceDrugId');
  const targetDrugId = watch('targetDrugId');
  const route = watch('route');
  const currentDose = watch('currentDose');
  const patientWeight = watch('patientWeight');

  const canCalculate =
    !!sourceDrugId &&
    !!targetDrugId &&
    !!route &&
    !!currentDose &&
    !!patientWeight &&
    !loading;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Left column: form inputs */}
      <div className="space-y-4">
        {drugError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Erro ao carregar medicamentos</span>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="sourceDrugId" className="text-sm font-medium">Medicamento de origem</label>
          <Select
            value={sourceDrugId}
            onValueChange={(v) => setValue('sourceDrugId', v, { shouldValidate: true })}
            disabled={!!drugError}
          >
            <SelectTrigger id="sourceDrugId" className="w-full">
              <SelectValue placeholder="Selecione o medicamento" />
            </SelectTrigger>
            <SelectContent>
              {drugOptions.map((drug) => (
                <SelectItem key={drug.id} value={drug.id}>
                  {drug.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sourceDrugId && (
            <p className="text-sm text-destructive" role="alert">
              {errors.sourceDrugId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="targetDrugId" className="text-sm font-medium">Medicamento de destino</label>
          <Select
            value={targetDrugId}
            onValueChange={(v) => setValue('targetDrugId', v, { shouldValidate: true })}
            disabled={!!drugError}
          >
            <SelectTrigger id="targetDrugId" className="w-full">
              <SelectValue placeholder="Selecione o medicamento" />
            </SelectTrigger>
            <SelectContent>
              {drugOptions.map((drug) => (
                <SelectItem key={drug.id} value={drug.id}>
                  {drug.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetDrugId && (
            <p className="text-sm text-destructive" role="alert">
              {errors.targetDrugId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="route" className="text-sm font-medium">Via de administração</label>
          <Select
            value={route}
            onValueChange={(v) => setValue('route', v, { shouldValidate: true })}
          >
            <SelectTrigger id="route" className="w-full">
              <SelectValue placeholder="Selecione a via" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="iv">Intravenosa</SelectItem>
              <SelectItem value="im">Intramuscular</SelectItem>
              <SelectItem value="sublingual">Sublingual</SelectItem>
              <SelectItem value="retal">Retal</SelectItem>
            </SelectContent>
          </Select>
          {errors.route && (
            <p className="text-sm text-destructive" role="alert">
              {errors.route.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="currentDose" className="text-sm font-medium">Dose atual</label>
          <Input
            id="currentDose"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 10.5"
            aria-invalid={!!errors.currentDose}
            {...register('currentDose')}
          />
          {errors.currentDose && (
            <p className="text-sm text-destructive" role="alert">
              {errors.currentDose.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="patientWeight" className="text-sm font-medium">Peso do paciente (kg)</label>
          <div className="relative">
            <Input
              id="patientWeight"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 22.5"
              aria-invalid={!!errors.patientWeight}
              {...register('patientWeight')}
            />
            <Lock
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          {errors.patientWeight && (
            <p className="text-sm text-destructive" role="alert">
              {errors.patientWeight.message}
            </p>
          )}
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          {loading ? 'Calculando...' : 'Calcular conversão'}
        </Button>
      </div>

      {/* Right column: result area */}
      <div aria-live="polite">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!loading && result && (
          <ClassificationBadge
            result={result}
            selectedDose={selectedDose}
            onSelectDose={onSelectDose}
          />
        )}

        {!loading && !result && (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Preencha todos os campos e clique em &quot;Calcular conversão&quot;
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ChevronRight, Info } from 'lucide-react';
import Decimal from 'decimal.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sedationFormSchema, type SedationFormData } from '../schemas';
import { useSedationStore } from '../store';
import { usePatientStore } from '@/features/patient/store';
import { useDrugCatalog } from '../api';
import { DrugCard } from './DrugCard';

const DEFAULT_PANEL_ID = '2';

interface DrugSelectionStepProps {
  onNext: () => void;
}

export function DrugSelectionStep({ onNext }: DrugSelectionStepProps) {
  const { sourceDrugId, targetDrugId, setSourceDrug, setTargetDrug, setCurrentDose } = useSedationStore();
  const activePatient = usePatientStore((s) => s.activePatient);

  const { data: drugCatalog = [], isLoading: catalogLoading } = useDrugCatalog(DEFAULT_PANEL_ID);
  const sourceDrug = sourceDrugId ? drugCatalog.find((d) => d.id === sourceDrugId) : undefined;
  const destinations = sourceDrugId
    ? (sourceDrug?.destinations ?? []).map((destId) => {
        const match = drugCatalog.find((d) => d.id === destId);
        return match ?? {
          id: destId,
          name: destId.split(' ')[0] ?? destId,
          category: '',
          route: destId.split(' ').slice(1).join(' '),
          icon: 'Pill',
          destinations: [],
          doseUnit: 'mg',
          dosePlaceholder: '5',
          taperType: 'midaz' as const,
          scaleType: 'RASS' as const,
        };
      })
    : [];

  const form = useForm<SedationFormData>({
    resolver: zodResolver(sedationFormSchema),
    defaultValues: {
      sourceDrugId: sourceDrugId ?? '',
      targetDrugId: targetDrugId ?? '',
      route: '',
      currentDose: '',
      patientWeight: activePatient?.peso ?? '',
    },
  });

  // Pre-fill weight from active patient
  useEffect(() => {
    if (activePatient?.peso) {
      form.setValue('patientWeight', activePatient.peso);
    }
  }, [activePatient, form]);

  // Sync store → form
  useEffect(() => {
    if (sourceDrugId) form.setValue('sourceDrugId', sourceDrugId);
  }, [sourceDrugId, form]);

  useEffect(() => {
    if (targetDrugId) form.setValue('targetDrugId', targetDrugId);
  }, [targetDrugId, form]);

  const handleSourceSelect = (id: string) => {
    // Toggle: clicking already-selected drug deselects it
    if (sourceDrugId === id) {
      setSourceDrug(null);
      setTargetDrug(null);
      form.setValue('sourceDrugId', '');
      form.setValue('targetDrugId', '');
      form.setValue('currentDose', '');
      return;
    }

    setSourceDrug(id);
    setTargetDrug(null);
    form.setValue('currentDose', '');
  };

  const handleTargetSelect = (id: string) => {
    setTargetDrug(id);
    form.setValue('targetDrugId', id);
    const dest = destinations.find((d) => d.id === id);
    if (dest) {
      form.setValue('route', dest.route.toLowerCase());
    }
  };

  const currentDose = useWatch({ control: form.control, name: 'currentDose' });
  const patientWeight = useWatch({ control: form.control, name: 'patientWeight' });

  const canProceed =
    !!sourceDrugId &&
    !!targetDrugId &&
    !!currentDose &&
    !!patientWeight &&
    (() => {
      try {
        return new Decimal(currentDose).gt(0) && new Decimal(patientWeight).gt(0);
      } catch {
        return false;
      }
    })();

  const handleNext = () => {
    if (!canProceed) return;
    const values = form.getValues();
    setCurrentDose(values.currentDose);
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Source drug selection */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Qual medicamento você vai converter?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione o medicamento de origem
        </p>
        <div className="mt-4" role="radiogroup" aria-label="Medicamento de origem">
          {catalogLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Carregando medicamentos...
            </div>
          ) : (
            (() => {
              const allSourceDrugs = drugCatalog;
              const selectedSourceDrug = sourceDrugId ? allSourceDrugs.find((d) => d.id === sourceDrugId) : null;
              const unselectedSourceDrugs = allSourceDrugs.filter((d) => d.id !== sourceDrugId);

              return (
                <>
                  {selectedSourceDrug && (
                    <DrugCard
                      drug={selectedSourceDrug}
                      selected={true}
                      onClick={() => handleSourceSelect(selectedSourceDrug.id)}
                    />
                  )}
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:grid-rows-[1fr]',
                      sourceDrugId ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
                    )}
                  >
                    <div className="flex flex-col gap-2 overflow-hidden min-h-0">
                      {unselectedSourceDrugs.map((drug) => (
                        <DrugCard
                          key={drug.id}
                          drug={drug}
                          selected={false}
                          onClick={() => handleSourceSelect(drug.id)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>

      {/* Destination drug selection — animated in */}
      {sourceDrugId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none">
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-900">
              Converter para qual medicamento?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o medicamento de destino
            </p>
            <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Medicamento de destino">
              {destinations.map((dest) => (
                <DrugCard
                  key={dest.id}
                  drug={dest}
                  selected={targetDrugId === dest.id}
                  onClick={() => handleTargetSelect(dest.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dose input — animated in */}
      {targetDrugId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none">
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-900">
              Dose atual do paciente
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dose de {sourceDrug?.name ?? '—'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="currentDose" className="mb-1.5 block text-xs font-medium text-gray-600">
                  Dose
                </label>
                <div className="relative">
                  <Input
                    id="currentDose"
                    type="text"
                    inputMode="decimal"
                    placeholder={sourceDrug?.dosePlaceholder ?? '0'}
                    aria-invalid={!!form.formState.errors.currentDose}
                    className="pr-16"
                    {...form.register('currentDose')}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {sourceDrug?.doseUnit ?? ''}
                  </span>
                </div>
                {form.formState.errors.currentDose && (
                  <p className="mt-1 text-xs text-destructive" role="alert">
                    {form.formState.errors.currentDose.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="patientWeight" className="mb-1.5 block text-xs font-medium text-gray-600">
                  Peso
                </label>
                <div className="relative">
                  <Input
                    id="patientWeight"
                    type="text"
                    inputMode="decimal"
                    placeholder="kg"
                    aria-invalid={!!form.formState.errors.patientWeight}
                    className="pr-10"
                    readOnly={!!activePatient?.peso}
                    {...form.register('patientWeight')}
                  />
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                {form.formState.errors.patientWeight && (
                  <p className="mt-1 text-xs text-destructive" role="alert">
                    {form.formState.errors.patientWeight.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-white/95 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Preencha dose e peso para prosseguir</span>
        </div>
        <Button
          size="lg"
          disabled={!canProceed}
          onClick={handleNext}
          className="gap-1"
        >
          Próximo
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

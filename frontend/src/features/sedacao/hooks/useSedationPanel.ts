import { useCallback, useEffect, useRef, useState } from 'react';
import Decimal from 'decimal.js';
import { toast } from 'sonner';
import { useSedationStore } from '../store';
import { usePanelCalculate, useCreateConversion, getTaperSchedule } from '../api';
import { usePatientStore } from '@/features/patient/store';
import type { PanelCalculationResult, ConversionPayload, TaperSchedule } from '../types';

// TODO: derive panelId dynamically from API or route params
const DEFAULT_PANEL_ID = '2';

export function useSedationPanel() {
  const activePatient = usePatientStore((s) => s.activePatient);
  const { phase, setPhase, sourceDrugId, targetDrugId, resetPanel } = useSedationStore();
  const [result, setResult] = useState<PanelCalculationResult | null>(null);
  const [selectedDose, setSelectedDose] = useState<'calculated' | 'recommended'>('calculated');

  const calculateMutation = usePanelCalculate();
  const conversionMutation = useCreateConversion();

  // Get taper schedule based on selected source drug
  const taperSchedule: TaperSchedule | null = sourceDrugId
    ? getTaperSchedule(sourceDrugId)
    : null;

  // Runs the conversion calculation. `advance` controls whether we move the
  // wizard forward to the convert phase (user action) or just recompute the
  // result in place (silent recovery after a remount).
  const runCalculation = useCallback(
    (advance: boolean) => {
      if (!sourceDrugId || !targetDrugId || !activePatient?.peso) return;

      const dose = useSedationStore.getState().currentDose;
      if (!dose) return;

      // Validate Decimal values before sending
      try {
        new Decimal(dose);
        new Decimal(activePatient.peso);
      } catch {
        return;
      }

      calculateMutation.mutate(
        {
          panelId: DEFAULT_PANEL_ID,
          origem: sourceDrugId,
          destino: targetDrugId,
          dose,
          pesoKg: activePatient.peso,
        },
        {
          onSuccess: (data) => {
            setResult(data);
            if (advance) {
              setSelectedDose('calculated');
              setPhase('convert');
            }
          },
          onError: () => {
            setResult(null);
          },
        },
      );
    },
    [calculateMutation, sourceDrugId, targetDrugId, activePatient, setPhase],
  );

  // User-triggered calculation
  const calculate = useCallback(() => runCalculation(true), [runCalculation]);

  // Recover a lost calculation after a remount (e.g. returning from the
  // dashboard mid-flow): the wizard phase persists in the store but `result`
  // lives in local state, so we silently recompute it from the persisted
  // inputs instead of dropping the user on a blank step. One-shot per mount.
  const recoveredRef = useRef(false);
  useEffect(() => {
    if (recoveredRef.current) return;
    if (phase === 'select' || result) return;
    recoveredRef.current = true;
    runCalculation(false);
  }, [phase, result, runCalculation]);

  const onPrescribe = useCallback(() => {
    if (!result || !sourceDrugId || !targetDrugId) return;

    const finalDose =
      selectedDose === 'recommended'
        ? result.recommended.value
        : result.perDose.value;

    const dose = useSedationStore.getState().currentDose;
    if (!dose || !activePatient?.peso) return;

    const payload: ConversionPayload = {
      panelId: DEFAULT_PANEL_ID,
      origem: sourceDrugId,
      destino: targetDrugId,
      dose,
      pesoKg: activePatient.peso,
      convertedDose: finalDose,
      convertedDoseUnit: result.perDose.unit,
      frequency: result.frequency,
      patientId: activePatient?.id ? Number(activePatient.id) : null,
      clientUuid: crypto.randomUUID(),
    };
    conversionMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Conversão registrada');
        setPhase('taper');
      },
      onError: () => {
        toast.error('Erro ao registrar conversão. Tente novamente.');
      },
    });
  }, [result, sourceDrugId, targetDrugId, conversionMutation, setPhase, selectedDose, activePatient]);

  const onFinish = useCallback(() => {
    toast.success('Atendimento finalizado com sucesso');
    resetPanel();
    setResult(null);
  }, [resetPanel]);

  // Wizard navigation
  const goToSelect = useCallback(() => setPhase('select'), [setPhase]);
  const goToConvert = useCallback(() => {
    if (result) setPhase('convert');
    else calculate();
  }, [result, calculate, setPhase]);
  const goToTaper = useCallback(() => setPhase('taper'), [setPhase]);
  const goToReview = useCallback(() => setPhase('review'), [setPhase]);

  return {
    result,
    setResult,
    loading: calculateMutation.isPending,
    error: calculateMutation.error,
    phase,
    setPhase,
    calculate,
    onPrescribe,
    prescribing: conversionMutation.isPending,
    selectedDose,
    setSelectedDose,
    taperSchedule,
    onFinish,
    finishing: false,
    goToSelect,
    goToConvert,
    goToTaper,
    goToReview,
    sourceDrugId,
    targetDrugId,
  };
}

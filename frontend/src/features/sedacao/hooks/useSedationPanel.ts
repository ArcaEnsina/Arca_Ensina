import { useCallback, useState } from 'react';
import Decimal from 'decimal.js';
import { toast } from 'sonner';
import { useSedationStore } from '../store';
import { usePanelCalculate, useCreatePrescription, getDrugById, getTaperSchedule } from '../api';
import { usePatientStore } from '@/features/patient/store';
import type { PanelCalculationResult, PrescriptionPayload, TaperSchedule } from '../types';

// TODO: derive panelId dynamically from API or route params
const DEFAULT_PANEL_ID = '2';

export function useSedationPanel() {
  const activePatient = usePatientStore((s) => s.activePatient);
  const { phase, setPhase, sourceDrugId, targetDrugId, resetPanel } = useSedationStore();
  const [result, setResult] = useState<PanelCalculationResult | null>(null);
  const [selectedDose, setSelectedDose] = useState<'calculated' | 'recommended'>('calculated');

  const calculateMutation = usePanelCalculate();
  const prescriptionMutation = useCreatePrescription();

  // Get taper schedule based on selected source drug
  const taperSchedule: TaperSchedule | null = sourceDrugId
    ? getTaperSchedule(sourceDrugId)
    : null;

  // User-triggered calculation
  const calculate = useCallback(() => {
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
          setSelectedDose('calculated');
          setPhase('convert');
        },
        onError: () => {
          setResult(null);
        },
      },
    );
  }, [calculateMutation, sourceDrugId, targetDrugId, activePatient, setPhase]);

  const onPrescribe = useCallback(() => {
    if (!result || !sourceDrugId || !targetDrugId) return;

    const sourceDrug = getDrugById(sourceDrugId);
    const finalDose =
      selectedDose === 'recommended'
        ? result.recommended.value
        : result.perDose.value;

    const payload: PrescriptionPayload = {
      panelId: DEFAULT_PANEL_ID,
      sourceDrugId,
      targetDrugId,
      route: sourceDrug?.route ?? '',
      convertedDose: finalDose,
      convertedDoseUnit: result.perDose.unit,
      frequency: result.frequency,
      clientUuid: crypto.randomUUID(),
    };
    prescriptionMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Prescrição registrada');
        setPhase('taper');
      },
      onError: () => {
        toast.error('Erro ao registrar prescrição. Tente novamente.');
      },
    });
  }, [result, sourceDrugId, targetDrugId, prescriptionMutation, setPhase, selectedDose]);

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

  return {
    result,
    setResult,
    loading: calculateMutation.isPending,
    error: calculateMutation.error,
    phase,
    setPhase,
    calculate,
    onPrescribe,
    prescribing: prescriptionMutation.isPending,
    selectedDose,
    setSelectedDose,
    taperSchedule,
    onFinish,
    finishing: false,
    goToSelect,
    goToConvert,
    goToTaper,
    sourceDrugId,
    targetDrugId,
  };
}

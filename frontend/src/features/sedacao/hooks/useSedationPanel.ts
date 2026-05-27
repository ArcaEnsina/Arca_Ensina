import { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Decimal from 'decimal.js';
import { toast } from 'sonner';
import { sedationFormSchema, type SedationFormData } from '../schemas';
import { useSedationStore } from '../store';
import { usePanelCalculate, useCreatePrescription } from '../api';
import { usePatientStore } from '@/features/patient/store';
import type { PanelCalculationResult, PrescriptionPayload } from '../types';

// TODO: derive panelId dynamically from API or route params
const DEFAULT_PANEL_ID = '2';

export function useSedationPanel() {
  const activePatient = usePatientStore((s) => s.activePatient);
  const { phase, setPhase } = useSedationStore();
  const [result, setResult] = useState<PanelCalculationResult | null>(null);
  const [selectedDose, setSelectedDose] = useState<'calculated' | 'recommended'>('calculated');

  const form = useForm<SedationFormData>({
    resolver: zodResolver(sedationFormSchema),
    defaultValues: {
      sourceDrugId: '',
      targetDrugId: '',
      route: '',
      currentDose: '',
      patientWeight: activePatient?.peso ?? '',
    },
  });

  const calculateMutation = usePanelCalculate();
  const prescriptionMutation = useCreatePrescription();

  // User-triggered calculation (eliminates race condition)
  const calculate = useCallback(() => {
    const values = form.getValues();
    if (
      !values.sourceDrugId ||
      !values.targetDrugId ||
      !values.route ||
      !values.currentDose ||
      !values.patientWeight
    ) {
      return;
    }

    // Validate Decimal values before sending
    try {
      new Decimal(values.currentDose);
      new Decimal(values.patientWeight);
    } catch {
      return;
    }

    calculateMutation.mutate(
      {
        panelId: DEFAULT_PANEL_ID,
        origem: values.sourceDrugId,
        destino: values.targetDrugId,
        dose: values.currentDose,
        pesoKg: values.patientWeight,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setSelectedDose('calculated'); // reset to calculated on new calculation
          if (phase === 'select' || phase === 'convert') {
            setPhase('convert'); // stay on convert step to review result and choose dose
          }
        },
        onError: () => {
          setResult(null);
        },
      },
    );
  }, [calculateMutation, form, phase, setPhase]);

  // Pre-fill weight from active patient
  useEffect(() => {
    if (activePatient?.peso) {
      form.setValue('patientWeight', activePatient.peso);
    }
  }, [activePatient, form]);

  const onPrescribe = useCallback(() => {
    if (!result) return;

    const values = form.getValues();
    const finalDose =
      selectedDose === 'recommended'
        ? result.recommended.value
        : result.perDose.value;

    const payload: PrescriptionPayload = {
      panelId: DEFAULT_PANEL_ID,
      sourceDrugId: values.sourceDrugId,
      targetDrugId: values.targetDrugId,
      route: values.route,
      convertedDose: finalDose,
      convertedDoseUnit: result.perDose.unit,
      frequency: result.frequency,
      clientUuid: crypto.randomUUID(),
    };
    prescriptionMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Prescrição registrada');
        setPhase('review');
      },
      onError: () => {
        toast.error('Erro ao registrar prescrição. Tente novamente.');
      },
    });
  }, [result, form, prescriptionMutation, setPhase, selectedDose]);

  return {
    form,
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
    dosesPerDay: result?.dosesPerDay ?? 1,
  };
}

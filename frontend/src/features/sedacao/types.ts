export type SedationPhase = 'select' | 'convert' | 'taper' | 'review';

export interface PanelDrugOption {
  id: string;
  name: string;
  route: string;
}

export interface DoseValue {
  value: string;
  unit: string;
}

export interface CalculationWarning {
  type: string;
  drug: string;
  currentDose: string;
  maxAllowed: string;
  unit: string;
  message: string;
}

export interface PanelCalculationResult {
  totalDaily: DoseValue;
  perDose: DoseValue;
  dosesPerDay: number;
  frequency: string;
  recommended: DoseValue;
  formulaApplied: string;
  warnings: CalculationWarning[];
}

export interface PanelCalculatePayload {
  panelId: string;
  origem: string;
  destino: string;
  dose: string;
  pesoKg: string;
  horario?: string;
}

export interface SedationFormValues {
  sourceDrugId: string;
  targetDrugId: string;
  route: string;
  currentDose: string;
  patientWeight: string;
}

export interface PrescriptionPayload {
  panelId: string;
  sourceDrugId: string;
  targetDrugId: string;
  route: string;
  convertedDose: string;
  convertedDoseUnit?: string;
  frequency: string;
  clientUuid: string;
}

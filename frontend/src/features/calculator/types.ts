// apresentação comercial (schema rico)
export interface Presentation {
  form: string
  route: string
  concentration_mg: number
  concentration_ml: number | null
  drops_per_ml: number | null
  package?: string | null
}

// regime de dosagem (schema rico)
export interface Regimen {
  indication: string
  off_label?: boolean
  dose_basis: 'per_dose' | 'per_day'
  dose_unit?: 'mg/kg' | 'mg/m2'
  routes?: string[]
  frequency_hours: number
  dose_mg_kg?: number | null
  notes?: string | null
}

import type { ContraindicationRule } from '@/engines/calculator/contraindications'

// dados recebidos da lista de medicamentos (+ campos ricos no detalhe)
export interface Medication {
  id: number
  name: string
  category: string
  description: string
  // presentes apenas no endpoint de detalhe e quando o med foi migrado
  presentations?: Presentation[] | null
  regimens?: Regimen[] | null
  // campos legados (endpoint de detalhe, med não migrado)
  prescription?: number | null
  frequency_hours?: number | null
  min_dose_mg_kg?: number | null
  max_dose_mg_kg?: number | null
  max_absolute_dose_mg?: number | null
  concentration_mg?: number | null
  concentration_ml?: number | null
  limits_by_age?: Record<string, { min?: number; max?: number; absolute_max?: number }> | null
  contraindications?: ContraindicationRule[] | null
  adjustments?: unknown
  administration?: unknown
  overdose?: unknown
  indications?: unknown
}

// dados enviados no formulário de cálculo
export interface CalculatorFormData {
  weight: number | null
  height: number | null
  age_days: number | null
  medication_id: number | null
  // seleções do schema rico (opcionais)
  indication?: string | null
  route?: string | null
  presentation_index?: number | null
  client_uuid?: string
}

// valores de exibição do formulário (strings dos inputs + unidades)
export interface CalculatorFormDisplay {
  weight: string
  weightUnit: 'kg' | 'g'
  height: string
  heightUnit: 'cm' | 'm'
  years: string
  months: string
}

export const EMPTY_DISPLAY: CalculatorFormDisplay = {
  weight: '',
  weightUnit: 'kg',
  height: '',
  heightUnit: 'cm',
  years: '',
  months: '',
}

// níveis de warning
export type WarningLevel = 'BAIXO' | 'ALTO' | 'CRITICO'

// aviso estruturado do motor (mensagem rica)
export interface WarningDetail {
  type: string
  severity: WarningLevel
  drug: string
  message: string
  current_dose: string
  max_allowed: string
  unit: string
  rule?: string
}

// dados que o backend retorna após o cálculo
export interface CalculationResult {
  dosage_mg: number | null
  dosage_per_dose: number | null
  frequency_per_day: number | null
  volume_ml: number | null // null se o medicamento não tem concentração
  drops: number | null // gotas por dose (apresentação em gotas)
  units: number | null // nº de unidades por dose (formas sólidas)
  unit_label: string | null // rótulo da unidade sólida (ex: "comprimidos")
  blocked: boolean // true se contraindicado (sem dose)
  warnings: WarningLevel[]
  warnings_detail: WarningDetail[]
  regimen: Regimen | null
  presentation: Presentation | null
  computedOffline?: boolean
}

import { Decimal } from '@/lib/decimal'
import * as medEngine from './medication'
import {
  evaluateContraindications,
  type ContraindicationRule,
  type ContraindicationWarning,
} from './contraindications'
import { classifyAgeBand } from './limits'
import type { DoseWarning } from './limits'

// Types

interface Presentation {
  form: string
  route: string
  concentration_mg: number
  concentration_ml: number | null
  drops_per_ml: number | null
  package?: string | null
}

interface Regimen {
  indication: string
  off_label?: boolean
  dose_basis: 'per_dose' | 'per_day'
  dose_unit?: 'mg/kg' | 'mg/m2'
  routes?: string[]
  frequency_hours: number
  dose_mg_kg?: number | null
  notes?: string | null
  min_dose_mg_kg?: number | null
  max_dose_mg_kg?: number | null
  daily_max_mg_kg?: number | null
  absolute_max_mg?: number | null
  limits_by_age?: Record<string, { min?: number; max?: number; absolute_max?: number }> | null
}

interface MedicationInput {
  id: number
  name: string
  // precisamos eliminar os filtros legados
  prescription?: number | null
  frequency_hours?: number | null
  min_dose_mg_kg?: number | null
  max_dose_mg_kg?: number | null
  max_absolute_dose_mg?: number | null
  concentration_mg?: number | null
  concentration_ml?: number | null
  limits_by_age?: Record<string, { min?: number; max?: number; absolute_max?: number }> | null
  contraindications?: ContraindicationRule[] | null
  // filé de peixe
  presentations?: Presentation[] | null
  regimens?: Regimen[] | null
}

export interface CalculationResult {
  dosage_mg: number | null
  dosage_per_dose: number | null
  frequency_per_day: number | null
  volume_ml: number | null
  drops: number | null
  units: number | null
  unit_label: string | null
  blocked: boolean
  warnings: string[]
  warnings_detail: Array<DoseWarning | ContraindicationWarning>
  regimen: Regimen | null
  presentation: Presentation | null
  computedOffline?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────────────

function _severities(warnings: Array<{ severity: string }>): string[] {
  return warnings.map((w) => w.severity)
}

function _selectRegimen(regimens: Regimen[], indication?: string | null): Regimen {
  if (indication) {
    const wanted = indication.trim().toLowerCase()
    for (const regimen of regimens) {
      if (regimen.indication?.trim().toLowerCase() === wanted) {
        return regimen
      }
    }
  }
  return regimens[0]! // impossivel ser nulo a exclamação avisa pro typescript isso
}

function _selectPresentation(
  presentations: Presentation[] | null | undefined,
  regimen: Regimen,
  presentationIndex?: number | null,
): Presentation | null {
  if (!presentations || presentations.length === 0) return null
  if (presentationIndex != null && presentationIndex >= 0 && presentationIndex < presentations.length) {
    return presentations[presentationIndex]!
  }
  const routes = regimen?.routes
  if (routes) {
    for (const presentation of presentations) {
      if (routes.includes(presentation.route)) {
        return presentation
      }
    }
  }
  return presentations[0]!
}

const _FORM_LABELS: Record<string, string> = {
  comprimido: 'comprimidos',
  supositorio: 'supositórios',
}

function _unitLabel(presentation: Presentation | null): string | null {
  if (!presentation) return null
  return _FORM_LABELS[presentation.form] ?? null
}

function _toNum(d: Decimal | null): number | null {
  return d != null ? d.toNumber() : null
}

function _emptyResult(
  blocks: ContraindicationWarning[],
  regimen: Regimen | null,
  presentation: Presentation | null,
): CalculationResult {
  return {
    blocked: true,
    dosage_mg: null,
    dosage_per_dose: null,
    frequency_per_day: null,
    volume_ml: null,
    drops: null,
    units: null,
    unit_label: null,
    warnings: _severities(blocks),
    warnings_detail: blocks,
    regimen,
    presentation,
  }
}

// APIs Publicas

export function calculateForMedication(
  medication: MedicationInput,
  {
    weight,
    height,
    ageDays,
    indication,
    route,
    presentationIndex,
  }: {
    weight: number
    height?: number | null
    ageDays?: number | null
    indication?: string | null
    route?: string | null
    presentationIndex?: number | null
  },
): CalculationResult {
  const regimens = medication.regimens

  // Refatorar quando todos os medicamentos também forem (mas tbm pode deixar já to tendo preguiça)
  if (!regimens || regimens.length === 0) {
    const result = medEngine.calculateMedicationDose({
      prescription: medication.prescription!,
      weight,
      frequencyHours: medication.frequency_hours!,
      height: null,
      ageDays,
      minDose: medication.min_dose_mg_kg,
      maxDose: medication.max_dose_mg_kg,
      absoluteMax: medication.max_absolute_dose_mg,
      limitsByAge: medication.limits_by_age,
      concentrationMg: medication.concentration_mg,
      concentrationMl: medication.concentration_ml,
      drug: medication.name,
    })

    return {
      blocked: false,
      dosage_mg: _toNum(result.dosage_mg),
      dosage_per_dose: _toNum(result.dosage_per_dose),
      frequency_per_day: result.frequency_per_day,
      volume_ml: _toNum(result.volume_ml),
      drops: _toNum(result.drops),
      units: _toNum(result.units),
      unit_label: null,
      warnings: _severities(result.warnings),
      warnings_detail: result.warnings,
      regimen: null,
      presentation: null,
    }
  }

  const regimen = _selectRegimen(regimens, indication)
  const presentation = _selectPresentation(medication.presentations, regimen, presentationIndex)

  const effRoute = route ?? (presentation?.route ?? null)
  const effForm = presentation?.form ?? null

  const blocks = evaluateContraindications({
    rules: medication.contraindications,
    ageDays,
    weight,
    route: effRoute,
    form: effForm,
    drug: medication.name,
  })

  const limitsByAge = regimen.limits_by_age
  if (limitsByAge && ageDays != null) {
    const band = classifyAgeBand(ageDays)
    if (limitsByAge[band] == null) {
      blocks.push({
        type: 'contraindicated',
        severity: 'CRITICO',
        drug: medication.name,
        rule: 'age_band_null',
        current_dose: '',
        max_allowed: '',
        unit: '',
        message: `Contraindicado para a faixa etária '${band}'.`,
      })
    }
  }

  // Calculo de BSA precisa de altura
  const doseUnit = regimen.dose_unit ?? 'mg/kg'
  if (doseUnit === 'mg/m2' && !height) {
    blocks.push({
      type: 'missing_data',
      severity: 'CRITICO',
      drug: medication.name,
      rule: 'height_required',
      current_dose: '',
      max_allowed: '',
      unit: '',
      message: 'Esta indicação é dosada por superfície corporal (mg/m²) e exige a altura do paciente.',
    })
  }

  if (blocks.length > 0) {
    return _emptyResult(blocks, regimen, presentation)
  }

  const result = medEngine.calculateMedicationDose({
    prescription: regimen.dose_mg_kg!,
    weight,
    frequencyHours: regimen.frequency_hours,
    height: doseUnit === 'mg/m2' ? height : null,
    ageDays,
    doseBasis: regimen.dose_basis ?? 'per_day',
    doseUnit,
    minDose: regimen.min_dose_mg_kg,
    maxDose: regimen.max_dose_mg_kg,
    dailyMax: regimen.daily_max_mg_kg,
    absoluteMax: regimen.absolute_max_mg,
    limitsByAge,
    presentation,
    drug: medication.name,
  })

  return {
    blocked: false,
    dosage_mg: _toNum(result.dosage_mg),
    dosage_per_dose: _toNum(result.dosage_per_dose),
    frequency_per_day: result.frequency_per_day,
    volume_ml: _toNum(result.volume_ml),
    drops: _toNum(result.drops),
    units: _toNum(result.units),
    unit_label: _unitLabel(presentation),
    warnings: _severities(result.warnings),
    warnings_detail: result.warnings,
    regimen,
    presentation,
  }
}

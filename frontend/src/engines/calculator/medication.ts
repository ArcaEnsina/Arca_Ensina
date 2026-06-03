import { Decimal } from '@/lib/decimal'
import { bsaMosteller } from './bsa'
import { doseToPresentation, doseToVolumeMl } from './concentration'
import { frequencyFromHours } from './frequency'
import { validateDoseRange, validateDoseRangeByAge } from './limits'
import type { DoseWarning } from './limits'

const _SEVERITY_ORDER: Record<string, number> = { BAIXO: 0, ALTO: 1, CRITICO: 2 }

export function calculateTotalDose(
  prescription: unknown,
  weight: unknown,
  height?: unknown,
): Decimal {
  const presc = new Decimal(String(prescription))
  const w = new Decimal(String(weight))

  if (height != null) {
    const h = new Decimal(String(height))
    if (presc.lte(0) || h.lte(0) || w.lte(0)) {
      throw new Error('Prescrição, altura e peso devem ser maiores que zero.')
    }
    const bsa = bsaMosteller(w, h)
    return presc.mul(bsa).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  }

  if (presc.lte(0) || w.lte(0)) {
    throw new Error('Prescrição e peso devem ser maiores que zero.')
  }
  return presc.mul(w).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function dosesPerDayFromHours(hours: unknown): number {
  const result = frequencyFromHours(hours)
  return result.doses_per_day.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}

export function dividePerDose(totalDoseMg: unknown, dosesPerDay: unknown): Decimal {
  const total = new Decimal(String(totalDoseMg))
  const doses = new Decimal(String(dosesPerDay))
  if (total.lte(0) || doses.lte(0)) {
    throw new Error('Dosagem e frequência por dia devem ser maiores que zero.')
  }
  return total.div(doses).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

function _resolveSizeBasis(
  prescription: unknown,
  weight: Decimal,
  height: unknown,
  doseUnit: string,
  doseBasis: string,
): [Decimal, Decimal, string] {
  if (doseUnit === 'mg/m2') {
    if (height == null) {
      throw new Error("dose_unit 'mg/m2' exige altura (height).")
    }
    const h = new Decimal(String(height))
    const base = calculateTotalDose(prescription, weight, h)
    const sizeDivisor = bsaMosteller(weight, h)
    const perUnitLabel = doseBasis === 'per_dose' ? 'mg/m²/dose' : 'mg/m²/dia'
    return [base, sizeDivisor, perUnitLabel]
  }

  const base = calculateTotalDose(prescription, weight)
  const perUnitLabel = doseBasis === 'per_dose' ? 'mg/kg/dose' : 'mg/kg/dia'
  return [base, weight, perUnitLabel]
}

function _splitDose(
  base: Decimal,
  doseBasis: string,
  frequencyPerDay: number,
  sizeDivisor: Decimal,
): [Decimal, Decimal, Decimal] {
  if (doseBasis === 'per_dose') {
    const perDose = base
    const total = perDose.mul(new Decimal(String(frequencyPerDay))).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    const comparisonValue = perDose.div(sizeDivisor)
    return [total, perDose, comparisonValue]
  }

  const total = base
  const perDose = dividePerDose(total, frequencyPerDay)
  const comparisonValue = total.div(sizeDivisor)
  return [total, perDose, comparisonValue]
}

function _dailyMaxWarning(
  total: Decimal,
  weight: Decimal,
  dailyMax: unknown,
  drug: string,
): DoseWarning | null {
  const dailyPerKg = total.div(weight)
  const max = new Decimal(String(dailyMax))
  if (dailyPerKg.lte(max)) return null
  const disp = dailyPerKg.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
  const dispStr = disp.toFixed(2)
  return {
    type: 'above_daily_max',
    severity: 'ALTO',
    drug,
    current_dose: dispStr,
    max_allowed: max.toString(),
    unit: 'mg/kg/dia',
    message: `Total diário (${dispStr} mg/kg/dia) acima do teto diário recomendado (${max} mg/kg/dia).`,
  }
}

function _collectWarnings({
  comparisonValue,
  total,
  weight,
  perUnitLabel,
  ageDays,
  limitsByAge,
  minDose,
  maxDose,
  absoluteMax,
  dailyMax,
  drug,
}: {
  comparisonValue: Decimal
  total: Decimal
  weight: Decimal
  perUnitLabel: string
  ageDays?: unknown
  limitsByAge?: Record<string, { min?: number; max?: number; absolute_max?: number }> | null
  minDose?: unknown
  maxDose?: unknown
  absoluteMax?: unknown
  dailyMax?: unknown
  drug: string
}): DoseWarning[] {
  let warnings: DoseWarning[]

  if (ageDays != null && limitsByAge) {
    warnings = validateDoseRangeByAge({
      dosePerKg: comparisonValue,
      totalDoseMg: total,
      ageDays,
      limitsByAge,
      drug,
      perUnitLabel,
    })
  } else {
    warnings = validateDoseRange({
      dosePerKg: comparisonValue,
      totalDoseMg: total,
      minDose,
      maxDose,
      absoluteMax,
      drug,
      perUnitLabel,
    })
  }

  if (dailyMax != null) {
    const dailyWarning = _dailyMaxWarning(total, weight, dailyMax, drug)
    if (dailyWarning != null) {
      warnings.push(dailyWarning)
    }
  }

  warnings.sort((a, b) => (_SEVERITY_ORDER[a.severity] ?? 99) - (_SEVERITY_ORDER[b.severity] ?? 99))
  return warnings
}

function _resolvePresentation(
  perDose: Decimal,
  presentation?: {
    concentration_mg?: number | null
    concentration_ml?: number | null
    form?: string
    drops_per_ml?: number | null
    route?: string
  } | null,
  concentrationMg?: unknown,
  concentrationMl?: unknown,
): [Decimal | null, Decimal | null, Decimal | null] {
  if (presentation != null) {
    const conversion = doseToPresentation(perDose, presentation)
    return [conversion.volume_ml, conversion.drops, conversion.units]
  }
  if (concentrationMg != null && concentrationMl != null) {
    const volumeMl = doseToVolumeMl(perDose, concentrationMg, concentrationMl)
    return [volumeMl, null, null]
  }
  return [null, null, null]
}

export interface MedicationDoseResult {
  dosage_mg: Decimal
  dosage_per_dose: Decimal
  frequency_per_day: number
  volume_ml: Decimal | null
  drops: Decimal | null
  units: Decimal | null
  warnings: DoseWarning[]
}
// gigantesco igual em python, se não quisermos spaghetti precisamos refatorar
export function calculateMedicationDose({
  prescription,
  weight,
  frequencyHours,
  height,
  ageDays,
  minDose,
  maxDose,
  absoluteMax,
  dailyMax,
  limitsByAge,
  doseBasis = 'per_day',
  doseUnit = 'mg/kg',
  concentrationMg,
  concentrationMl,
  presentation,
  drug = '',
}: {
  prescription: unknown
  weight: unknown
  frequencyHours: unknown
  height?: unknown
  ageDays?: unknown
  minDose?: unknown
  maxDose?: unknown
  absoluteMax?: unknown
  dailyMax?: unknown
  limitsByAge?: Record<string, { min?: number; max?: number; absolute_max?: number }> | null
  doseBasis?: string
  doseUnit?: string
  concentrationMg?: unknown
  concentrationMl?: unknown
  presentation?: {
    concentration_mg?: number | null
    concentration_ml?: number | null
    form?: string
    drops_per_ml?: number | null
    route?: string
  } | null
  drug?: string
}): MedicationDoseResult {
  if (doseBasis !== 'per_day' && doseBasis !== 'per_dose') {
    throw new Error(`dose_basis inválido: ${doseBasis}`)
  }
  if (doseUnit !== 'mg/kg' && doseUnit !== 'mg/m2') {
    throw new Error(`dose_unit inválido: ${doseUnit}`)
  }

  const w = new Decimal(String(weight))
  const [base, sizeDivisor, perUnitLabel] = _resolveSizeBasis(
    prescription,
    w,
    height,
    doseUnit,
    doseBasis,
  )
  const frequencyPerDay = dosesPerDayFromHours(frequencyHours)
  const [total, perDose, comparisonValue] = _splitDose(base, doseBasis, frequencyPerDay, sizeDivisor)

  const warnings = _collectWarnings({
    comparisonValue,
    total,
    weight: w,
    perUnitLabel,
    ageDays,
    limitsByAge,
    minDose,
    maxDose,
    absoluteMax,
    dailyMax,
    drug,
  })

  const [volumeMl, drops, units] = _resolvePresentation(
    perDose,
    presentation,
    concentrationMg,
    concentrationMl,
  )

  return {
    dosage_mg: total,
    dosage_per_dose: perDose,
    frequency_per_day: frequencyPerDay,
    volume_ml: volumeMl,
    drops,
    units,
    warnings,
  }
}

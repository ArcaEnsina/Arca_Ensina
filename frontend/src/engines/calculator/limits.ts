import { Decimal } from '@/lib/decimal'

const _NEONATAL_MAX = 28
const _LACTENTE_MAX = 365
const _CRIANCA_MAX = 365 * 12
const _ADOLESCENTE_MAX = 365 * 18

export function classifyAgeBand(ageDays: unknown): string {
  const age = Math.floor(Number(ageDays))
  if (age < _NEONATAL_MAX) return 'neonatal'
  if (age < _LACTENTE_MAX) return 'lactente'
  if (age < _CRIANCA_MAX) return 'crianca'
  if (age < _ADOLESCENTE_MAX) return 'adolescente'
  return 'adulto'
}

// Decimal.js remove os zeros a direita.; Python's Decimal mantem eles
// pelo quantize(). toFixed() faz o matching parity não quebrar.
function _fmt4(value: unknown): string {
  return new Decimal(String(value)).toFixed(4)
}

export interface DoseWarning {
  type: string
  severity: string
  drug: string
  current_dose: string
  max_allowed: string
  unit: string
  message: string
}

function _warning(
  severity: string,
  wtype: string,
  drug: string,
  currentDoseStr: string,
  limit: Decimal,
  unit: string,
  message: string,
): DoseWarning {
  return {
    type: wtype,
    severity,
    drug,
    current_dose: currentDoseStr,
    max_allowed: limit.toString(),
    unit,
    message,
  }
}

export function validateDoseRange({
  dosePerKg,
  totalDoseMg,
  minDose,
  maxDose,
  absoluteMax,
  drug = '',
  perUnitLabel = 'mg/kg/dia',
}: {
  dosePerKg: unknown
  totalDoseMg: unknown
  minDose?: unknown
  maxDose?: unknown
  absoluteMax?: unknown
  drug?: string
  perUnitLabel?: string
}): DoseWarning[] {
  const warnings: DoseWarning[] = []
  const dose = new Decimal(String(dosePerKg))
  const total = new Decimal(String(totalDoseMg))

  if (minDose != null) {
    const min = new Decimal(String(minDose))
    if (dose.lt(min)) {
      const dispStr = _fmt4(dose)
      warnings.push(
        _warning(
          'BAIXO',
          'below_min_recommended',
          drug,
          dispStr,
          min,
          perUnitLabel,
          `Dose (${dispStr} ${perUnitLabel}) abaixo do mínimo recomendado (${min} ${perUnitLabel}).`,
        ),
      )
    }
  }

  if (maxDose != null) {
    const max = new Decimal(String(maxDose))
    if (dose.gt(max)) {
      const dispStr = _fmt4(dose)
      warnings.push(
        _warning(
          'ALTO',
          'above_max_recommended',
          drug,
          dispStr,
          max,
          perUnitLabel,
          `Dose (${dispStr} ${perUnitLabel}) acima do máximo recomendado (${max} ${perUnitLabel}).`,
        ),
      )
    }
  }

  if (absoluteMax != null) {
    const absMax = new Decimal(String(absoluteMax))
    if (total.gt(absMax)) {
      const totalStr = total.toFixed(2)
      warnings.push(
        _warning(
          'CRITICO',
          'above_absolute_max',
          drug,
          totalStr,
          absMax,
          'mg',
          `Dose total (${totalStr} mg) acima do teto absoluto (${absMax} mg).`,
        ),
      )
    }
  }

  return warnings
}

export function validateDoseRangeByAge({
  dosePerKg,
  totalDoseMg,
  ageDays,
  limitsByAge,
  drug = '',
  perUnitLabel = 'mg/kg/dia',
}: {
  dosePerKg: unknown
  totalDoseMg: unknown
  ageDays: unknown
  limitsByAge: Record<string, { min?: number; max?: number; absolute_max?: number } | undefined>
  drug?: string
  perUnitLabel?: string
}): DoseWarning[] {
  const band = classifyAgeBand(ageDays)
  if (!(band in limitsByAge)) {
    throw new Error('Faixa etária não encontrada nos limites fornecidos.')
  }
  const bandLimits = limitsByAge[band]!
  return validateDoseRange({
    dosePerKg,
    totalDoseMg,
    minDose: bandLimits.min,
    maxDose: bandLimits.max,
    absoluteMax: bandLimits.absolute_max,
    drug,
    perUnitLabel,
  })
}

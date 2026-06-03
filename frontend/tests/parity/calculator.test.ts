import { describe, it, expect } from 'vitest'
import { calculateForMedication } from '@/engines/calculator'
import cases from '../../../fixtures/calculator/cases.json'
import expected from '../../../fixtures/calculator/expected.json'

function normalize(result: any) {
  const fmt = (v: number | null, places: number): string | null =>
    v == null ? null : v.toFixed(places)

  return {
    blocked: result.blocked,
    dosage_mg: fmt(result.dosage_mg, 2),
    dosage_per_dose: fmt(result.dosage_per_dose, 2),
    frequency_per_day: result.frequency_per_day,
    volume_ml: fmt(result.volume_ml, 2),
    drops: fmt(result.drops, 0),
    units: fmt(result.units, 2),
    unit_label: result.unit_label,
    warnings: result.warnings,
    warnings_detail: result.warnings_detail.map((w: any) => ({
      type: w.type,
      severity: w.severity,
      drug: w.drug,
      current_dose: w.current_dose,
      max_allowed: w.max_allowed,
      unit: w.unit,
      message: w.message,
      ...(w.rule !== undefined ? { rule: w.rule } : {}),
    })),
    regimen: result.regimen,
    presentation: result.presentation,
  }
}

describe('Calculator Parity (EXP-002)', () => {
  it('matches Python expected.json for all cases', () => {
    for (let i = 0; i < cases.length; i++) {
      const case_ = (cases as any[])[i]
      const exp = (expected as any[])[i]

      const result = calculateForMedication(case_.medication, {
        weight: case_.input.weight,
        height: case_.input.height ?? null,
        ageDays: case_.input.age_days ?? null,
        indication: case_.input.indication ?? null,
        route: case_.input.route ?? null,
        presentationIndex: case_.input.presentation_index ?? null,
      })

      const normalized = normalize(result)
      expect(normalized).toEqual(exp.result)
    }
  })
})

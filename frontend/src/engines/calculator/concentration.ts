import { Decimal } from '@/lib/decimal'

export function doseToVolumeMl(
  doseMg: unknown,
  concentrationMg: unknown,
  concentrationMl: unknown,
): Decimal {
  const dose = new Decimal(String(doseMg))
  const concMg = new Decimal(String(concentrationMg))
  const concMl = new Decimal(String(concentrationMl))
  if (dose.lte(0) || concMg.lte(0) || concMl.lte(0)) {
    throw new Error(
      'Dosagem, concentração do frasco e volume do frasco devem ser maiores que zero.',
    )
  }
  const concentration = concMg.div(concMl)
  return dose.div(concentration).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function doseToDrops(
  doseMg: unknown,
  concentrationMg: unknown,
  concentrationMl: unknown,
  dropsPerMl: unknown,
): Decimal {
  const drops = new Decimal(String(dropsPerMl))
  if (drops.lte(0)) {
    throw new Error('Gotas por mL deve ser maior que zero.')
  }
  const volumeMl = doseToVolumeMl(doseMg, concentrationMg, concentrationMl)
  return volumeMl.mul(drops).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
}

export interface PresentationResult {
  volume_ml: Decimal | null
  drops: Decimal | null
  units: Decimal | null
}

export function doseToPresentation(
  doseMg: unknown,
  presentation: {
    concentration_mg?: number | null
    concentration_ml?: number | null
    form?: string
    drops_per_ml?: number | null
  },
): PresentationResult {
  const concentrationMg = presentation.concentration_mg
  const concentrationMl = presentation.concentration_ml

  if (concentrationMl == null) {
    let units: Decimal | null = null
    if (concentrationMg != null) {
      units = new Decimal(String(doseMg))
        .div(new Decimal(String(concentrationMg)))
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    }
    return { volume_ml: null, drops: null, units }
  }

  const volumeMl = doseToVolumeMl(doseMg, concentrationMg, concentrationMl)
  let drops: Decimal | null = null
  if (
    presentation.form === 'gotas' &&
    presentation.drops_per_ml != null
  ) {
    drops = doseToDrops(
      doseMg,
      concentrationMg,
      concentrationMl,
      presentation.drops_per_ml,
    )
  }
  return { volume_ml: volumeMl, drops, units: null }
}

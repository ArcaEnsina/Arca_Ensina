import { Decimal } from '@/lib/decimal'

export interface FrequencyResult {
  interval_hours: number | Decimal
  doses_per_day: Decimal
}

export function frequencyFromHours(hours: unknown): FrequencyResult {
  const interval = new Decimal(String(hours))
  if (interval.lte(0)) {
    throw new Error('Tempo da prescrição deve ser maior que zero.')
  }
  const intervalHours: number | Decimal = interval.equals(interval.toDecimalPlaces(0))
    ? interval.toNumber()
    : interval
  return {
    interval_hours: intervalHours,
    doses_per_day: new Decimal('24').div(interval),
  }
}

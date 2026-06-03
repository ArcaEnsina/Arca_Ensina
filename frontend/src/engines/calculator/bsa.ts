import { Decimal } from '@/lib/decimal'

export function bsaMosteller(weightKg: unknown, heightCm: unknown): Decimal {
  const weight = new Decimal(String(weightKg))
  const height = new Decimal(String(heightCm))
  if (weight.lte(0) || height.lte(0)) {
    throw new Error('Altura e peso devem ser maiores que zero.')
  }
  return height.mul(weight).div(new Decimal('3600')).sqrt()
}

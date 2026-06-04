import Decimal from 'decimal.js'

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }

export const normalizeDecimalInput = (v: unknown) =>
  typeof v === 'string' ? v.replace(',', '.') : v

export const D = (v: unknown) => new Decimal(String(normalizeDecimalInput(v)))
export const cent = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

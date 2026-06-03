import Decimal from 'decimal.js'

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }
export const D = (v: unknown) => new Decimal(String(v))
export const cent = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

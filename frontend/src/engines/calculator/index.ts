export { bsaMosteller } from './bsa'
export { frequencyFromHours } from './frequency'
export {
  doseToVolumeMl,
  doseToDrops,
  doseToPresentation,
} from './concentration'
export {
  classifyAgeBand,
  validateDoseRange,
  validateDoseRangeByAge,
} from './limits'
export { evaluateContraindications } from './contraindications'
export {
  calculateTotalDose,
  dosesPerDayFromHours,
  dividePerDose,
  calculateMedicationDose,
} from './medication'
export { calculateForMedication } from './service'
export type { CalculationResult } from './service'

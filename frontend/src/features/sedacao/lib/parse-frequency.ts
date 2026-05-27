import Decimal from 'decimal.js';

/**
 * Parse frequency string to number of doses per day.
 * Supports: "6/6h" (4x/day), "4/4h" (6x/day), "8/8h" (3x/day), "contínua" (1x/day)
 */
export function parseFrequencyToDosesPerDay(frequency: string): number {
  const normalized = frequency.toLowerCase().trim();

  if (normalized.includes('contínua') || normalized === 'contínuo') {
    return 1;
  }

  // Match patterns like "6/6h", "q6h", "a cada 6h"
  const intervalMatch = normalized.match(/(\d+)\s*[/h]/);
  if (intervalMatch) {
    const intervalHours = parseInt(intervalMatch[1], 10);
    if (intervalHours > 0) {
      return Math.floor(24 / intervalHours);
    }
  }

  // Match "q4h", "q6h" etc.
  const qMatch = normalized.match(/q(\d+)h?/);
  if (qMatch) {
    const intervalHours = parseInt(qMatch[1], 10);
    if (intervalHours > 0) {
      return Math.floor(24 / intervalHours);
    }
  }

  // Default fallback
  return 1;
}

/**
 * Calculate dose per administration from total daily dose.
 */
export function calculateDosePerAdministration(
  totalDose: string,
  dosesPerDay: number,
): string {
  try {
    const total = new Decimal(totalDose);
    const perDose = total.dividedBy(dosesPerDay);
    return perDose.toDecimalPlaces(4).toString();
  } catch {
    return totalDose;
  }
}

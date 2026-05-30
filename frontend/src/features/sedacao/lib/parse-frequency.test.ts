import { describe, it, expect } from 'vitest';
import {
  parseFrequencyToDosesPerDay,
  calculateDosePerAdministration,
} from './parse-frequency';

describe('parseFrequencyToDosesPerDay', () => {
  it('parses "6/6h" as 4 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('6/6h')).toBe(4);
  });

  it('parses "8/8h" as 3 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('8/8h')).toBe(3);
  });

  it('parses "4/4h" as 6 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('4/4h')).toBe(6);
  });

  it('parses "12/12h" as 2 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('12/12h')).toBe(2);
  });

  it('parses "contínua" as 1 dose per day', () => {
    expect(parseFrequencyToDosesPerDay('contínua')).toBe(1);
  });

  it('parses "contínuo" as 1 dose per day', () => {
    expect(parseFrequencyToDosesPerDay('contínuo')).toBe(1);
  });

  it('parses "q6h" as 4 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('q6h')).toBe(4);
  });

  it('parses "q4h" as 6 doses per day', () => {
    expect(parseFrequencyToDosesPerDay('q4h')).toBe(6);
  });

  it('returns 1 for unknown frequency', () => {
    expect(parseFrequencyToDosesPerDay('unknown')).toBe(1);
  });

  it('returns 1 for empty string', () => {
    expect(parseFrequencyToDosesPerDay('')).toBe(1);
  });

  it('handles case insensitive input', () => {
    expect(parseFrequencyToDosesPerDay('CONTÍNUA')).toBe(1);
    expect(parseFrequencyToDosesPerDay('6/6H')).toBe(4);
  });

  it('handles whitespace', () => {
    expect(parseFrequencyToDosesPerDay('  6/6h  ')).toBe(4);
    expect(parseFrequencyToDosesPerDay('  contínua  ')).toBe(1);
  });
});

describe('calculateDosePerAdministration', () => {
  it('divides total dose by doses per day', () => {
    expect(calculateDosePerAdministration('162.0', 4)).toBe('40.5');
  });

  it('handles non-round divisions with 4 decimal places', () => {
    expect(calculateDosePerAdministration('100', 3)).toBe('33.3333');
  });

  it('returns original dose when dosesPerDay is 1', () => {
    expect(calculateDosePerAdministration('5.0', 1)).toBe('5');
  });

  it('handles decimal input', () => {
    expect(calculateDosePerAdministration('10.5', 4)).toBe('2.625');
  });

  it('returns original dose on invalid input', () => {
    expect(calculateDosePerAdministration('invalid', 4)).toBe('invalid');
  });
});

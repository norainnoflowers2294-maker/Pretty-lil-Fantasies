import { describe, expect, it } from 'bun:test';
import { calculateBirthYearFromAge } from './zodiac';

describe('calculateBirthYearFromAge', () => {
  it('uses the current year when the birthday has already passed', () => {
    const now = new Date();
    const expected = now.getFullYear() - 28 - (now.getMonth() === 0 && now.getDate() === 1 ? 1 : 0);
    expect(calculateBirthYearFromAge('28', '01/01')).toBe(String(expected));
  });

  it('uses the previous year when the birthday is still upcoming', () => {
    const now = new Date();
    const expected = now.getFullYear() - 28 - (now.getMonth() === 11 && now.getDate() === 31 ? 0 : 1);
    expect(calculateBirthYearFromAge('28', '12/31')).toBe(String(expected));
  });

  it('does not calculate a year for invalid ages', () => {
    expect(calculateBirthYearFromAge('', '10/24')).toBe('');
    expect(calculateBirthYearFromAge('151', '10/24')).toBe('');
  });
});

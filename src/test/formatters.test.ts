import { describe, it, expect } from 'vitest';
import { formatPercentage, formatPhoneNumber } from '../lib/formatters';
import { formatArabicDate, formatArabicTime } from '../lib/date-utils';

describe('Formatters and Date Utils', () => {
  it('formats percentages accurately', () => {
    expect(formatPercentage(85.44)).toBe('85.4%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(null)).toBe('0%');
  });

  it('formats Egyptian phone numbers with clean spacing', () => {
    expect(formatPhoneNumber('01012345678')).toBe('0101 234 5678');
    expect(formatPhoneNumber('01223456789')).toBe('0122 345 6789');
    expect(formatPhoneNumber('')).toBe('—');
  });

  it('formats dates in Arabic properly', () => {
    const formatted = formatArabicDate('2026-10-14');
    expect(formatted).toContain('أكتوبر');
    expect(formatted).toContain('2026');
  });

  it('formats time properly in Arabic AM/PM', () => {
    const timeFormatted = formatArabicTime('2026-10-14T18:00:00Z');
    expect(timeFormatted).not.toBe('—');
  });
});

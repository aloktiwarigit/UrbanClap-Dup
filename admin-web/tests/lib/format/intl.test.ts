import { describe, it, expect } from 'vitest';
import { formatINR, formatDate, formatDateTime } from '@/lib/format/intl';

describe('formatINR', () => {
  it('formats with hi-IN lakh grouping', () => {
    const result = formatINR(12345600, 'hi');
    expect(result).toContain('₹');
    expect(result).toContain('1,23,456');
  });
  it('formats with en-IN grouping', () => {
    const result = formatINR(12345600, 'en');
    expect(result).toContain('₹');
  });
  it('converts paise to rupees correctly', () => {
    const result = formatINR(59900, 'hi');
    expect(result).toContain('599');
  });
});

describe('formatDate', () => {
  it('formats hi-IN medium date with Hindi month name', () => {
    const result = formatDate(new Date('2026-05-05T00:00:00Z'), 'hi');
    expect(result).toMatch(/मई/);
  });
  it('formats en medium date with English month name', () => {
    const result = formatDate(new Date('2026-05-05T00:00:00Z'), 'en');
    expect(result).toMatch(/May/);
  });
  it('accepts ISO string input', () => {
    const result = formatDate('2026-05-05T00:00:00Z', 'hi');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('includes time component in output', () => {
    const result = formatDateTime(new Date('2026-05-05T10:30:00Z'), 'en');
    expect(result).toMatch(/\d+:\d+/);
  });
  it('formats hi-IN date-time with Hindi month', () => {
    const result = formatDateTime(new Date('2026-05-05T10:30:00Z'), 'hi');
    expect(result).toMatch(/मई/);
  });
});

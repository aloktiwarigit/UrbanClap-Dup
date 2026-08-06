import { describe, it, expect } from 'vitest';
import { formatINR, formatDate, formatDateTime, paiseToRupeeNumber, rupeesToPaise } from '@/lib/format/intl';

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
  it('defaults to 2 decimal places for currency display', () => {
    const result = formatINR(193750, 'en');
    expect(result).toBe('₹1,937.50');
  });
  it('accepts Intl.NumberFormatOptions overrides for callers needing fewer decimals (e.g. chart axis ticks)', () => {
    const result = formatINR(59900, 'en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    expect(result).toBe('₹599');
  });
  it('guards against non-integer paise input (defensive rounding, mirrors the Android Double-drift fix) without producing rounding drift', () => {
    // Simulates an upstream float-serialization artifact — e.g. 59900.00000000001 —
    // that must still resolve to a clean ₹599.00, not drift to ₹598.99 / ₹599.01.
    const result = formatINR(59900.00000000001, 'en');
    expect(result).toBe('₹599.00');
  });
  it('rounds a fractional-paise input to the nearest whole paise before formatting', () => {
    const result = formatINR(59900.6, 'en');
    expect(result).toBe('₹599.01');
  });
});

describe('paiseToRupeeNumber', () => {
  it('converts whole-rupee paise to an unformatted number', () => {
    expect(paiseToRupeeNumber(59900)).toBe(599);
  });
  it('converts fractional-rupee paise to an unformatted number', () => {
    expect(paiseToRupeeNumber(1050)).toBe(10.5);
  });
  it('defensively rounds non-integer paise input before dividing (no float drift)', () => {
    expect(paiseToRupeeNumber(59900.00000000001)).toBe(599);
  });
  it('handles zero', () => {
    expect(paiseToRupeeNumber(0)).toBe(0);
  });
});

describe('rupeesToPaise', () => {
  it('converts a whole-rupee string to paise', () => {
    expect(rupeesToPaise('500')).toBe(50000);
  });
  it('converts a different whole-rupee string to a distinct paise value (regression guard for the orders Min/Max ₹ filter unit-mismatch bug)', () => {
    // The bug: an operator typing "500" in the Min ₹ box filtered for
    // orders >= 500 paise (₹5), not >= ₹500, because the raw rupee string
    // was sent straight through to a paise-denominated API field. This
    // pins the correct 100x conversion so a regression can't reintroduce
    // the raw pass-through.
    expect(rupeesToPaise('600')).toBe(60000);
    expect(rupeesToPaise('600')).not.toBe(600);
  });
  it('converts a fractional-rupee string to paise without float drift', () => {
    expect(rupeesToPaise('599.99')).toBe(59999);
  });
  it('accepts a numeric input directly', () => {
    expect(rupeesToPaise(120)).toBe(12000);
  });
  it('rounds rather than truncates to guard against float multiplication artifacts', () => {
    expect(rupeesToPaise(19.999999999999996)).toBe(2000);
  });
  it('returns undefined for a blank string so callers can omit the filter', () => {
    expect(rupeesToPaise('')).toBeUndefined();
  });
  it('returns undefined for non-numeric input', () => {
    expect(rupeesToPaise('abc')).toBeUndefined();
  });
  it('handles zero', () => {
    expect(rupeesToPaise('0')).toBe(0);
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

import { describe, it, expect } from 'vitest';
import { IST_WEEK_KEY_RE, istWeekKey, istWeekBounds, previousIstWeekKey } from '../../src/lib/ist-time.js';

describe('istWeekKey', () => {
  it('Monday 00:30 IST is the new week; 30 minutes earlier is still the old one', () => {
    // Sun 18:00Z = Sun 23:30 IST (week 36); Sun 19:00Z = Mon 00:30 IST (week 37).
    expect(istWeekKey(new Date('2026-09-06T18:00:00.000Z'))).toBe('2026-W36');
    expect(istWeekKey(new Date('2026-09-06T19:00:00.000Z'))).toBe('2026-W37');
  });
  it('a UTC instant already in the next IST day resolves into the right week', () => {
    expect(istWeekKey(new Date('2026-09-08T19:30:00.000Z'))).toBe('2026-W37'); // Wed 01:00 IST
  });
  it('handles the ISO year boundary in both directions', () => {
    expect(istWeekKey(new Date('2027-01-01T06:30:00.000Z'))).toBe('2026-W53');
    expect(istWeekKey(new Date('2027-01-04T06:30:00.000Z'))).toBe('2027-W01');
  });
  it('every emitted key matches IST_WEEK_KEY_RE', () => {
    for (let i = 0; i < 400; i++) {
      expect(istWeekKey(new Date(Date.UTC(2026, 0, 1) + i * 86_400_000))).toMatch(IST_WEEK_KEY_RE);
    }
  });
});

describe('istWeekBounds', () => {
  it('returns Mon..Sun IST dates and a half-open 7-day UTC interval', () => {
    const b = istWeekBounds('2026-W37');
    expect(b.weekStart).toBe('2026-09-07');
    expect(b.weekEnd).toBe('2026-09-13');
    expect(b.startUtc.toISOString()).toBe('2026-09-06T18:30:00.000Z'); // Mon 00:00 IST
    expect(b.endUtc.toISOString()).toBe('2026-09-13T18:30:00.000Z');   // next Mon 00:00 IST
  });
  it('round-trips with istWeekKey for every week of 2026 and 2027', () => {
    for (const y of [2026, 2027]) {
      for (let w = 1; w <= 52; w++) {
        const key = `${y}-W${String(w).padStart(2, '0')}`;
        expect(istWeekKey(istWeekBounds(key).startUtc)).toBe(key);
      }
    }
  });
  it('rejects malformed keys', () => {
    for (const bad of ['2026-37', '2026-W00', '2026-W54']) {
      expect(() => istWeekBounds(bad)).toThrow(/invalid IST week key/);
    }
  });
  it('rejects a syntactically valid but nonexistent ISO week (2027 has no week 53)', () => {
    expect(() => istWeekBounds('2027-W53')).toThrow(/nonexistent ISO week/);
  });
});

describe('previousIstWeekKey', () => {
  it('Monday 00:30 IST returns the week that just ended, across the year boundary too', () => {
    expect(previousIstWeekKey(new Date('2026-09-06T19:00:00.000Z'))).toBe('2026-W36');
    expect(previousIstWeekKey(new Date('2027-01-03T19:00:00.000Z'))).toBe('2026-W53');
  });
});

import { describe, it, expect } from 'vitest';
import { IST_OFFSET_MS, istDateStr, istWeekStart } from '../../src/lib/ist-time.js';

describe('IST_OFFSET_MS', () => {
  it('is 5.5 hours in milliseconds', () => {
    expect(IST_OFFSET_MS).toBe(5.5 * 60 * 60 * 1000);
  });
});

describe('istDateStr', () => {
  it('returns the IST calendar date for a UTC instant that is already the next day in IST', () => {
    // 2026-05-05T19:30:00Z is Tue 19:30 UTC but Wed 01:00 IST.
    const d = new Date('2026-05-05T19:30:00.000Z');
    expect(istDateStr(d)).toBe('2026-05-06');
  });

  it('returns the IST calendar date for an instant that does not cross midnight', () => {
    const d = new Date('2026-05-05T05:00:00.000Z'); // 10:30 IST, same day
    expect(istDateStr(d)).toBe('2026-05-05');
  });
});

describe('istWeekStart', () => {
  it('Sunday 23:30 IST returns the previous Monday (Monday of that same calendar week)', () => {
    // 2026-05-03 is a Sunday (UTC). 23:30 IST on that Sunday = 18:00 UTC same day.
    const sunday2330Ist = new Date('2026-05-03T18:00:00.000Z');
    const weekStart = istWeekStart(sunday2330Ist);
    expect(weekStart.toISOString()).toBe('2026-04-26T18:30:00.000Z'); // Monday 2026-04-27 00:00 IST
    expect(istDateStr(weekStart)).toBe('2026-04-27');
  });

  it('Monday 00:30 IST returns that same Monday', () => {
    // 2026-05-04 is the Monday after 2026-05-03. 00:30 IST = 19:00 UTC the previous day.
    const monday0030Ist = new Date('2026-05-03T19:00:00.000Z');
    const weekStart = istWeekStart(monday0030Ist);
    expect(weekStart.toISOString()).toBe('2026-05-03T18:30:00.000Z'); // Monday 2026-05-04 00:00 IST
    expect(istDateStr(weekStart)).toBe('2026-05-04');
  });

  it('a UTC instant that is already the next day in IST resolves to the correct week', () => {
    // 2026-05-05T19:30:00Z is Tue 19:30 UTC but Wed 2026-05-06 01:00 IST — same week as the
    // Monday 00:30 IST case above.
    const d = new Date('2026-05-05T19:30:00.000Z');
    const weekStart = istWeekStart(d);
    expect(weekStart.toISOString()).toBe('2026-05-03T18:30:00.000Z');
  });
});

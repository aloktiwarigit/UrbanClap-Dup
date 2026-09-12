/**
 * Shared IST (India Standard Time, UTC+05:30) calendar helpers.
 *
 * `src/functions/earnings.ts` has its own private IST_OFFSET_MS + toIstDateStr
 * (last-7-days rolling window, not a Monday-start ISO week) — deliberately left
 * alone. This module is for callers that need a Monday-anchored calendar week
 * (E21-S02 commission-due weekSummary), so it does not replace that one.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** IST calendar date (YYYY-MM-DD) for a UTC instant. */
export function istDateStr(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Monday 00:00 IST of the calendar week containing `d`, returned as the
 * equivalent UTC instant (so it can be compared directly against Cosmos'
 * UTC `createdAt` ISO strings).
 */
export function istWeekStart(d: Date): Date {
  const istInstant = new Date(d.getTime() + IST_OFFSET_MS);
  const dayOfWeek = istInstant.getUTCDay(); // 0=Sun .. 6=Sat, read off the IST-shifted clock
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon->0, Tue->1, ..., Sun->6
  const mondayIst = new Date(istInstant);
  mondayIst.setUTCDate(istInstant.getUTCDate() - daysSinceMonday);
  const mondayDateStr = mondayIst.toISOString().slice(0, 10);
  return new Date(new Date(`${mondayDateStr}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
}

const DAY_MS = 86_400_000;

/** `YYYY-Www`, ISO-8601 week-of-year. Weeks 01–53 only. */
export const IST_WEEK_KEY_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

/**
 * ISO-8601 week key of the IST calendar week containing `d`.
 * All arithmetic runs on UTC-midnight Dates rebuilt from the IST calendar date string, so the
 * +05:30 shift is applied exactly once (inside istWeekStart) and day maths cannot drift.
 */
export function istWeekKey(d: Date): string {
  const monday = new Date(`${istDateStr(istWeekStart(d))}T00:00:00.000Z`);
  const thursday = new Date(monday.getTime() + 3 * DAY_MS); // ISO week-year = year of the Thursday
  const isoYear = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));           // ISO week 1 contains 4 January
  const week1Monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS);
  const week = Math.round((monday.getTime() - week1Monday.getTime()) / (7 * DAY_MS)) + 1;
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Inverse of `istWeekKey`. The UTC interval is HALF-OPEN — `[startUtc, endUtc)` — so a
 * receivable created at exactly Monday 00:00:00.000 IST belongs to the new week only, and no
 * instant is ever counted in two weeks.
 */
export function istWeekBounds(weekKey: string): {
  weekStart: string; weekEnd: string; startUtc: Date; endUtc: Date;
} {
  if (!IST_WEEK_KEY_RE.test(weekKey)) throw new Error(`invalid IST week key: ${weekKey}`);
  const isoYear = Number(weekKey.slice(0, 4));
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week1Monday = new Date(jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS);
  const monday = new Date(week1Monday.getTime() + (Number(weekKey.slice(6)) - 1) * 7 * DAY_MS);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = new Date(monday.getTime() + 6 * DAY_MS).toISOString().slice(0, 10);
  const startUtc = new Date(new Date(`${weekStart}T00:00:00.000Z`).getTime() - IST_OFFSET_MS);
  const endUtc = new Date(startUtc.getTime() + 7 * DAY_MS);

  // Not every ISO year has 53 weeks; `2027-W53` parses but names no week. Round-tripping is
  // the only honest existence check.
  if (istWeekKey(startUtc) !== weekKey) throw new Error(`nonexistent ISO week: ${weekKey}`);
  return { weekStart, weekEnd, startUtc, endUtc };
}

/** The key of the IST week that ended immediately before the one containing `d`. */
export function previousIstWeekKey(d: Date): string {
  return istWeekKey(new Date(istWeekStart(d).getTime() - 1));
}

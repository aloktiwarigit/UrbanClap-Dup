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

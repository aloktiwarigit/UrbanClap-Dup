import type { Service } from '../schemas/service.js';

// IST offset from UTC in minutes (UTC+5:30)
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** Returns today's date in IST as "YYYY-MM-DD". */
export function todayIst(): string {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Returns current minute-of-day in IST (0–1439). */
export function currentIstMinuteOfDay(): number {
  const now = new Date();
  const istMs = now.getTime() + IST_OFFSET_MINUTES * 60_000;
  const istDate = new Date(istMs);
  return istDate.getUTCHours() * 60 + istDate.getUTCMinutes();
}

/**
 * Generates non-overlapping slot windows for a service on a given date.
 * Returns strings like "08:00-09:00". Does not filter past times — call
 * filterElapsedSlots() when the date is today (IST) to remove past windows.
 */
export function generateSlots(service: Service, _date: string): string[] {
  const startMin = timeToMinutes(service.workStart ?? '08:00');
  const endMin = timeToMinutes(service.workEnd ?? '20:00');
  const duration = service.durationMinutes;
  const slots: string[] = [];

  for (let cur = startMin; cur + duration <= endMin; cur += duration) {
    slots.push(`${minutesToTime(cur)}-${minutesToTime(cur + duration)}`);
  }

  return slots;
}

/**
 * Removes slots whose start time is at or before nowMinute (minute-of-day, IST).
 * Apply when date === today IST to prevent booking/showing past time slots.
 */
export function filterElapsedSlots(slots: string[], nowMinute: number): string[] {
  return slots.filter((window) => {
    const startTime = window.split('-')[0] ?? '';
    return timeToMinutes(startTime) > nowMinute;
  });
}

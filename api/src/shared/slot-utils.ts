import type { Service } from '../schemas/service.js';

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generates non-overlapping slot windows for a service on a given date.
 * Returns strings like "08:00-09:00". Does not filter past times — caller
 * is responsible for date range validation.
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

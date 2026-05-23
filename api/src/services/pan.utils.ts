import { createHash } from 'node:crypto';

const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;

export function normalizePan(pan: string): string {
  return pan.trim().toUpperCase();
}

export function maskPan(pan: string): string | null {
  const normalized = normalizePan(pan);
  if (!PAN_REGEX.test(normalized)) return null;
  return `XXXXX${normalized.slice(5)}`;
}

export function hashPan(pan: string): string {
  return createHash('sha256').update(normalizePan(pan)).digest('hex');
}

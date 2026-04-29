/**
 * Audit-log coverage invariant (W2-2' gate).
 *
 * Each handler listed below MUST reference an audit-producing call.
 * Add a handler to AUDIT_HANDLERS when you wire a new audit entry so this
 * test catches future accidental removals at CI time.
 *
 * Modeled on dispatcher-data-isolation.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(here, '..', '..');

function readApiFile(rel: string): string {
  return readFileSync(resolve(API_ROOT, rel), 'utf8');
}

/** Each entry: [relative path, token that must appear in the source]. */
const AUDIT_HANDLERS: [string, string][] = [
  ['src/functions/trigger-no-show-detector.ts', 'NO_SHOW_CREDIT_ISSUED'],
  ['src/functions/trigger-no-show-detector.ts', 'NO_SHOW_REDISPATCH_INITIATED'],
  ['src/functions/trigger-no-show-detector.ts', 'BOOKING_UNFULFILLED'],
  ['src/functions/webhooks.ts', 'PAYMENT_CAPTURED'],
  ['src/functions/bookings.ts', 'CUSTOMER_CONFIRMED_PAYMENT'],
  ['src/functions/kyc/submit-aadhaar.ts', 'kycAuditEntry'],
  ['src/functions/kyc/submit-pan-ocr.ts', 'kycAuditEntry'],
  ['src/functions/admin/auth/login.ts', 'ADMIN_LOGIN_FAILED'],
  ['src/functions/rating-escalate.ts', 'RATING_SHIELD_ESCALATED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_CATEGORY_CREATED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_CATEGORY_UPDATED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_CATEGORY_TOGGLED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_SERVICE_CREATED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_SERVICE_UPDATED'],
  ['src/functions/catalogue-admin.ts', 'CATALOGUE_SERVICE_TOGGLED'],
];

describe('Audit-log P1 coverage invariant', () => {
  it.each(AUDIT_HANDLERS)(
    '%s contains audit token "%s"',
    (file, token) => {
      const content = readApiFile(file);
      expect(content).toContain(token);
    },
  );
});

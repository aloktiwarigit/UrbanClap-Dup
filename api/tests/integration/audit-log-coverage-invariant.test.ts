import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PRIVILEGED_HANDLERS = [
  'src/functions/webhooks.ts',
  'src/functions/bookings.ts',
  'src/functions/kyc/submit-aadhaar.ts',
  'src/functions/kyc/submit-pan-ocr.ts',
  'src/functions/trigger-no-show-detector.ts',
  'src/functions/admin/auth/login.ts',
  'src/functions/rating-escalate.ts',
  'src/functions/catalogue-admin.ts',
];

describe('FR-9.4 audit-log coverage invariant', () => {
  it.each(PRIVILEGED_HANDLERS)('%s contains an audit_log write', (file) => {
    const src = readFileSync(resolve(__dirname, '..', '..', file), 'utf8');
    const hasCall =
      /\bauditLog\s*\(/.test(src) ||
      /\bappendAuditEntry\s*\(/.test(src) ||
      /\bkycAuditEntry\s*\(/.test(src) ||
      /\bcatalogueAuditEntry\s*\(/.test(src);
    expect(hasCall, `${file} has no audit log call`).toBe(true);
  });
});

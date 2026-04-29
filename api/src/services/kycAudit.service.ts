import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';

// maskedIdentifier deliberately omitted: audit_log is immutable so PII (PAN,
// Aadhaar) must never land in payload — erasure path only anonymizes resourceId.
export async function kycAuditEntry(
  technicianId: string,
  kycMethod: string,
  kycStatus: string,
): Promise<void> {
  try {
    const ts = new Date().toISOString();
    await appendAuditEntry({
      id: randomUUID(),
      adminId: 'system',
      role: 'system',
      action: `KYC_${kycMethod.toUpperCase()}_${kycStatus}`,
      resourceType: 'technician',
      resourceId: technicianId,
      payload: { kycMethod, kycStatus },
      timestamp: ts,
      partitionKey: ts.slice(0, 7),
    });
  } catch (err) {
    Sentry.captureException(err);
  }
}

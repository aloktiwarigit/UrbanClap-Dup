import { randomUUID } from 'node:crypto';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';

export function kycAuditEntry(
  technicianId: string,
  kycMethod: string,
  kycStatus: string,
  maskedIdentifier: string,
): Promise<void> {
  const ts = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId: 'system',
    role: 'system',
    action: `KYC_${kycMethod.toUpperCase()}_${kycStatus}`,
    resourceType: 'technician',
    resourceId: technicianId,
    payload: { kycMethod, kycStatus, maskedIdentifier },
    timestamp: ts,
    partitionKey: ts.slice(0, 7),
  });
}

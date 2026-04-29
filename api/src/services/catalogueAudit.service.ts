import { randomUUID } from 'node:crypto';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AdminRole } from '../types/admin.js';

export function catalogueAuditEntry(
  adminId: string,
  role: AdminRole,
  action: string,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const ts = new Date().toISOString();
  return appendAuditEntry({
    id: randomUUID(),
    adminId,
    role,
    action,
    resourceType,
    resourceId,
    payload,
    timestamp: ts,
    partitionKey: ts.slice(0, 7),
  });
}

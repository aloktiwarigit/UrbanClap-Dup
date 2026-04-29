import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AdminRole } from '../types/admin.js';

// Synchronous (awaited by callers) but error-absorbing: admin catalogue actions
// must be audited in order (not fire-and-forget) so the entry is guaranteed to
// precede the HTTP response, yet a transient Cosmos failure should not 500 the
// mutation that already succeeded.
export async function catalogueAuditEntry(
  adminId: string,
  role: AdminRole,
  action: string,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const ts = new Date().toISOString();
    await appendAuditEntry({
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
  } catch (err) {
    Sentry.captureException(err);
  }
}

import { auditLog } from './auditLog.service.js';
import type { AdminContext } from '../types/admin.js';

export function catalogueAuditEntry(
  admin: AdminContext,
  action: string,
  resource: 'category' | 'service',
  id: string,
  payload: Record<string, unknown>,
): void {
  void auditLog(
    { adminId: admin.adminId, role: admin.role, sessionId: admin.sessionId },
    action,
    resource,
    id,
    payload,
  );
}

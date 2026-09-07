import * as Sentry from '@sentry/node';
import { randomUUID } from 'node:crypto';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import type { AdminRole, AuditAction } from '../types/admin.js';
import type { AuditLogDoc } from '../schemas/audit-log.js';

export interface AuditLogContext {
  adminId: string;
  role: AdminRole;
  sessionId?: string;
}

export async function auditLog(
  ctx: AuditLogContext,
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
  extras?: { ip?: string; userAgent?: string },
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const base: Omit<AuditLogDoc, 'ip' | 'userAgent'> = {
      id: randomUUID(),
      adminId: ctx.adminId,
      role: ctx.role,
      action,
      resourceType,
      resourceId,
      payload,
      timestamp,
      partitionKey: timestamp.slice(0, 7),
    };
    const doc: AuditLogDoc = {
      ...base,
      ...(extras?.ip !== undefined && { ip: extras.ip }),
      ...(extras?.userAgent !== undefined && { userAgent: extras.userAgent }),
    };
    await appendAuditEntry(doc);
  } catch (err) {
    Sentry.captureException(err);
  }
}

/**
 * Convenience helper for system-initiated audit entries (E21-S02 Task 12).
 * Calls auditLog with adminId='system' and role='system'.
 */
export async function systemAudit(
  action: AuditAction,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  return auditLog({ adminId: 'system', role: 'system' }, action, resourceType, resourceId, payload);
}

import { z } from 'zod';

export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  adminId: z.string(),
  role: z.enum(['super-admin', 'ops-manager', 'finance', 'support-agent', 'system']),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  payload: z.record(z.unknown()),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/** Shape stored in Cosmos — entry fields + partition key (yyyy-mm). */
export type AuditLogDoc = AuditLogEntry & { partitionKey: string };

export const AuditLogQuerySchema = z.object({
  adminId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  continuationToken: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

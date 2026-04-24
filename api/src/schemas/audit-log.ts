import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  role: z.enum(['super-admin', 'ops-manager', 'finance', 'support-agent', 'system']),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

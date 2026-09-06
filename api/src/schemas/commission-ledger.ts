import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CommissionReceivableEntrySchema } from './commission-receivable.js';
extendZodWithOpenApi(z);

export const LedgerDocTypeSchema = z.enum(['RECEIVABLE', 'REMITTANCE', 'CREDIT', 'INCENTIVE_AWARD']);
export type LedgerDocType = z.infer<typeof LedgerDocTypeSchema>;

export const RemittancePhysicalMethodSchema = z.enum(['UPI', 'CASH_DEPOSIT']);

export const RemittanceDocSchema = z.object({
  id: z.string().min(1),                 // `rem:${idempotencyKey}`
  docType: z.literal('REMITTANCE'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: RemittancePhysicalMethodSchema,
  ref: z.string().min(1),
  note: z.string().max(500).optional(),
  allocations: z.array(z.object({ bookingId: z.string(), paise: z.number().int().positive() })),
  creditCreatedPaise: z.number().int().nonnegative(),
  recordedByAdminId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  createdAt: z.string(),
});
export type RemittanceDoc = z.infer<typeof RemittanceDocSchema>;

export const CreditDocSchema = z.object({
  id: z.string().min(1),                 // `cr:${refId}`
  docType: z.literal('CREDIT'),
  technicianId: z.string().min(1),
  partitionKey: z.string().min(1),
  source: z.enum(['OVERPAYMENT', 'INCENTIVE']),
  refId: z.string().min(1),
  originalPaise: z.number().int().positive(),
  remainingPaise: z.number().int().nonnegative(),
  consumedBy: z.array(z.object({ bookingId: z.string(), paise: z.number().int().positive(), appliedAt: z.string() })),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CreditDoc = z.infer<typeof CreditDocSchema>;

/** Read-path union. Absent docType = RECEIVABLE (every E21-S01 doc). */
export const LedgerDocSchema = z.preprocess(
  (v) => (v && typeof v === 'object' && !('docType' in v) ? { ...v, docType: 'RECEIVABLE' } : v),
  z.discriminatedUnion('docType', [
    CommissionReceivableEntrySchema.extend({ docType: z.literal('RECEIVABLE') }),
    RemittanceDocSchema,
    CreditDocSchema,
    z.object({ docType: z.literal('INCENTIVE_AWARD') }).passthrough(), // E23 defines the body
  ]),
);
export type LedgerDoc = z.infer<typeof LedgerDocSchema>;

export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9._-]{8,128}$/;
export const RecordRemittanceBodySchema = z.object({
  technicianId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  method: RemittancePhysicalMethodSchema,
  ref: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  idempotencyKey: z.string().regex(IDEMPOTENCY_KEY_RE),
}).strict();
export type RecordRemittanceBody = z.infer<typeof RecordRemittanceBodySchema>;

export const remittanceDocId = (idempotencyKey: string): string => `rem:${idempotencyKey}`;
export const creditDocId = (refId: string): string => `cr:${refId}`;
export const allocationId = (refId: string, bookingId: string): string => `${refId}:${bookingId}`;

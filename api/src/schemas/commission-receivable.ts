import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CommissionBpsSchema, CommissionResolvedFromSchema, type CommissionResolvedFrom } from './commission-config.js';

extendZodWithOpenApi(z);

/** Lifecycle of a single booking's commission owed by the technician to the platform (cash pilot). */
export const RemittanceStatusSchema = z.enum(['DUE', 'REMITTED', 'WAIVED']);
export type RemittanceStatus = z.infer<typeof RemittanceStatusSchema>;

export const RemittanceMethodSchema = z.enum(['UPI', 'CASH_DEPOSIT', 'ADJUSTMENT']);
export type RemittanceMethod = z.infer<typeof RemittanceMethodSchema>;

/**
 * E21-S01: One document per completed cash booking in the `commission_receivables` container
 * (pk /technicianId). id === bookingId for idempotent point reads. Records the commission the
 * technician OWES the platform (the platform never held the cash). `commissionBps` /
 * `commissionResolvedFrom` are snapshotted at settlement time so later config edits never
 * retroactively re-rate a recorded receivable.
 */
export const CommissionReceivableEntrySchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  technicianId: z.string(),
  partitionKey: z.string(),
  serviceId: z.string(),
  categoryId: z.string(),
  bookingAmount: z.number().int().positive(),
  cashCollectedAmount: z.number().int().nonnegative().optional(),
  commissionBps: CommissionBpsSchema,
  commissionDue: z.number().int().nonnegative(),
  commissionResolvedFrom: CommissionResolvedFromSchema,
  remittanceStatus: RemittanceStatusSchema,
  remittedAmount: z.number().int().nonnegative().optional(),
  remittedAt: z.string().optional(),
  remittanceRef: z.string().optional(),
  remittanceMethod: RemittanceMethodSchema.optional(),
  markedByAdminId: z.string().optional(),
  waivedReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type CommissionReceivableEntry = z.infer<typeof CommissionReceivableEntrySchema>;

export type CommissionReceivableCreateInput = {
  bookingId: string;
  technicianId: string;
  serviceId: string;
  categoryId: string;
  bookingAmount: number;
  commissionBps: number;
  commissionDue: number;
  commissionResolvedFrom: CommissionResolvedFrom;
  cashCollectedAmount?: number;
};

/** Per-technician roll-up for the admin commission-collection dashboard. */
export const TechnicianOutstandingSummarySchema = z.object({
  technicianId: z.string(),
  technicianName: z.string(),
  dueCount: z.number().int().nonnegative(),
  totalCommissionDue: z.number().int().nonnegative(),
  oldestDueAt: z.string().optional(),
});
export type TechnicianOutstandingSummary = z.infer<typeof TechnicianOutstandingSummarySchema>;

export const CommissionReceivablesDashboardSchema = z.object({
  technicians: z.array(TechnicianOutstandingSummarySchema),
  totalOutstanding: z.number().int().nonnegative(),
});
export type CommissionReceivablesDashboard = z.infer<typeof CommissionReceivablesDashboardSchema>;

/** Admin action to settle (REMIT) or write off (WAIVE) a technician's commission for a booking. */
export const MarkCommissionReceivedBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('REMIT'),
    bookingId: z.string().min(1),
    technicianId: z.string().min(1),
    remittedAmount: z.number().int().positive(),
    remittanceMethod: RemittanceMethodSchema,
    remittanceRef: z.string().min(1),
  }),
  z.object({
    action: z.literal('WAIVE'),
    bookingId: z.string().min(1),
    technicianId: z.string().min(1),
    waivedReason: z.string().min(1),
  }),
]);
export type MarkCommissionReceivedBody = z.infer<typeof MarkCommissionReceivedBodySchema>;

/** Tech-facing GET /v1/technicians/me/commission-due response. */
export const TechnicianCommissionDueSchema = z.object({
  totalOutstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  entries: z.array(
    z.object({
      bookingId: z.string(),
      bookingAmount: z.number().int().nonnegative(),
      commissionDue: z.number().int().nonnegative(),
      createdAt: z.string(),
    }),
  ),
});
export type TechnicianCommissionDue = z.infer<typeof TechnicianCommissionDueSchema>;

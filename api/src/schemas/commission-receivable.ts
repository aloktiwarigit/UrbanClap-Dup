import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { CommissionBpsSchema, CommissionResolvedFromSchema, type CommissionResolvedFrom } from './commission-config.js';
import { HoldStateSchema } from './technician.js';

extendZodWithOpenApi(z);

/** Lifecycle of a single booking's commission owed by the technician to the platform (cash pilot). */
export const RemittanceStatusSchema = z.enum(['DUE', 'REMITTED', 'WAIVED']);
export type RemittanceStatus = z.infer<typeof RemittanceStatusSchema>;

export const RemittanceMethodSchema = z.enum(['UPI', 'CASH_DEPOSIT', 'ADJUSTMENT']);
export type RemittanceMethod = z.infer<typeof RemittanceMethodSchema>;

/** E24: how the money changed hands at the door (completion-time). Distinct from booking.paymentMethod. */
export const CollectionMethodSchema = z.enum(['CASH', 'UPI_QR']);
export type CollectionMethod = z.infer<typeof CollectionMethodSchema>;

export const AllocationSourceSchema = z.enum(['REMITTANCE', 'INCENTIVE', 'WAIVER']);
/** One credit applied to a receivable. id = `${refId}:${bookingId}` so a replay is detectable. */
export const AllocationSchema = z.object({
  id: z.string().min(1),
  source: AllocationSourceSchema,
  refId: z.string().min(1),
  paise: z.number().int().positive(),
  appliedAt: z.string(),
  byId: z.string().min(1),
});
export type Allocation = z.infer<typeof AllocationSchema>;

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
  docType: z.literal('RECEIVABLE').optional(),
  allocations: z.array(AllocationSchema).optional(),
  serviceName: z.string().optional(),
  slotDate: z.string().optional(),
  collectionMethod: CollectionMethodSchema.optional(),
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
  serviceName?: string;
  slotDate?: string;
  collectionMethod?: CollectionMethod;
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

/** Derived, never stored. */
export function outstandingOf(e: Pick<CommissionReceivableEntry, 'commissionDue' | 'remittedAmount'>): number {
  return Math.max(0, e.commissionDue - (e.remittedAmount ?? 0));
}

/**
 * E21-S02: Tech-facing GET /v1/technicians/me/commission-due response, v2. Field names of
 * `TechnicianCommissionDueSchema` (v1) are preserved (`totalOutstandingPaise`, `dueCount`,
 * `entries[].bookingId/bookingAmount/commissionDue/createdAt`) so old APKs keep parsing what
 * they already read — but `totalOutstandingPaise` is now NET of partial remittances/credits,
 * not gross `commissionDue`. `TechnicianCommissionDueSchema` (v1) stays registered in the
 * OpenAPI registry until Task 13 swaps it for this one.
 */
export const TechnicianCommissionDueV2Schema = z.object({
  totalOutstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  hold: z.object({
    state: HoldStateSchema,
    warnPaise: z.number().int().nonnegative(),
    blockPaise: z.number().int().nonnegative(),
    enforcementEnabled: z.boolean(),
    override: z.object({ until: z.string(), reason: z.string() }).optional(),
  }),
  entries: z.array(
    z.object({
      bookingId: z.string(),
      serviceName: z.string().optional(),
      slotDate: z.string().optional(),
      bookingAmount: z.number().int().nonnegative(),
      cashCollectedAmount: z.number().int().nonnegative().optional(),
      commissionDue: z.number().int().nonnegative(),
      remittedAmount: z.number().int().nonnegative(),
      outstandingPaise: z.number().int().nonnegative(),
      collectionMethod: CollectionMethodSchema.optional(),
      remittanceStatus: RemittanceStatusSchema,
      createdAt: z.string(),
    }),
  ),
  remittances: z.array(
    z.object({
      id: z.string(),
      amountPaise: z.number().int().nonnegative(),
      method: RemittanceMethodSchema,
      ref: z.string(),
      createdAt: z.string(),
    }),
  ),
  credits: z.array(
    z.object({
      id: z.string(),
      source: z.enum(['OVERPAYMENT', 'INCENTIVE']),
      remainingPaise: z.number().int().nonnegative(),
      createdAt: z.string(),
    }),
  ),
  weekSummary: z.object({
    weekStart: z.string(),
    jobs: z.number().int().nonnegative(),
    cashCollectedPaise: z.number().int().nonnegative(),
    commissionPaise: z.number().int().nonnegative(),
    netPaise: z.number().int().nonnegative(),
  }),
});
export type TechnicianCommissionDueV2 = z.infer<typeof TechnicianCommissionDueV2Schema>;

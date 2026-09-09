import { z } from 'zod';

const isValidCalendarDate = (v: string) => !isNaN(Date.parse(v));

export const DailyPnLEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidCalendarDate, { message: 'must be a valid calendar date' }),
  grossRevenue: z.number().nonnegative(),
  commission: z.number().nonnegative(),
  netToOwner: z.number().nonnegative(),
});
export type DailyPnLEntry = z.infer<typeof DailyPnLEntrySchema>;

export const FinanceSummaryQuerySchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD')
      .refine(isValidCalendarDate, { message: 'from must be a valid calendar date' }),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD')
      .refine(isValidCalendarDate, { message: 'to must be a valid calendar date' }),
  })
  .refine(({ from, to }) => from <= to, { message: 'from must not be after to', path: ['from'] });
export type FinanceSummaryQuery = z.infer<typeof FinanceSummaryQuerySchema>;

export const FinanceSummarySchema = z.object({
  dailyPnL: z.array(DailyPnLEntrySchema),
  totalGross: z.number().nonnegative(),
  totalCommission: z.number().nonnegative(),
  totalNet: z.number().nonnegative(),
  // Additive (task 10, E21-S03). Sourced from arePayoutsEnabled() (shared/payouts-enabled.ts) —
  // the same single source of truth the payout-approval endpoint and the prepaid-payout timers
  // already gate on — so admin-web can hide the Payout Queue for the cash-only pilot instead of
  // guessing from the absence of an HTTP field. Optional here only so the Cosmos-derived
  // `getDailyPnL` return value (which knows nothing about env config) still satisfies this type
  // without constructing it; the HTTP handler (functions/admin/finance/summary.ts) always sets
  // it, so every real response carries it.
  payoutsEnabled: z.boolean().optional(),
});
export type FinanceSummary = z.infer<typeof FinanceSummarySchema>;

export const PayoutQueueEntrySchema = z.object({
  technicianId: z.string().min(1),
  technicianName: z.string().min(1),
  completedJobsThisWeek: z.number().int().nonnegative(),
  grossEarnings: z.number().nonnegative(),
  commissionDeducted: z.number().nonnegative(),
  netPayable: z.number().nonnegative(),
});
export type PayoutQueueEntry = z.infer<typeof PayoutQueueEntrySchema>;

export const PayoutQueueSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidCalendarDate, { message: 'must be a valid calendar date' }),
  weekEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidCalendarDate, { message: 'must be a valid calendar date' }),
  entries: z.array(PayoutQueueEntrySchema),
  totalNetPayable: z.number().nonnegative(),
});
export type PayoutQueue = z.infer<typeof PayoutQueueSchema>;

export const PayoutErrorSchema = z.object({
  technicianId: z.string().min(1),
  reason: z.string(),
});
export type PayoutError = z.infer<typeof PayoutErrorSchema>;

export const ApprovePayoutsResponseSchema = z.object({
  approved: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z.array(PayoutErrorSchema),
});
export type ApprovePayoutsResponse = z.infer<typeof ApprovePayoutsResponseSchema>;

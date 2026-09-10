import { z } from 'zod';

const isValidCalendarDate = (v: string) => !isNaN(Date.parse(v));

export const DailyPnLEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidCalendarDate, { message: 'must be a valid calendar date' }),
  grossRevenue: z.number().nonnegative(),
  commission: z.number().nonnegative(),
  // WIDENED (E23-S01): an incentive applied on a day with no completed bookings makes the day's
  // net legitimately negative. Read paths only widen (spec §3.3), so `.nonnegative()` comes off
  // rather than the value being clamped and the owner shown a wrong zero.
  netToOwner: z.number(),
  /** Additive: commission offset by incentive credits that IST day. Optional so the
   *  Cosmos-derived FinanceSummary still satisfies this type before the field is set. */
  incentiveCostPaise: z.number().int().nonnegative().optional(),
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
  // WIDENED (E23-S01): see DailyPnLEntrySchema.netToOwner — a day's award with no bookings can
  // push the aggregate negative too.
  totalNet: z.number(),
  /** Additive: sum of the day-level incentiveCostPaise entries over the range. */
  totalIncentiveCost: z.number().nonnegative().optional(),
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

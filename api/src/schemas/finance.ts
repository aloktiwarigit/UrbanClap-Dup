import { z } from 'zod';

export const DailyPnLEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grossRevenue: z.number().nonnegative(),
  commission: z.number().nonnegative(),
  netToOwner: z.number().nonnegative(),
});
export type DailyPnLEntry = z.infer<typeof DailyPnLEntrySchema>;

export const FinanceSummaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
});
export type FinanceSummaryQuery = z.infer<typeof FinanceSummaryQuerySchema>;

export const FinanceSummarySchema = z.object({
  dailyPnL: z.array(DailyPnLEntrySchema),
  totalGross: z.number().nonnegative(),
  totalCommission: z.number().nonnegative(),
  totalNet: z.number().nonnegative(),
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
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(PayoutQueueEntrySchema),
  totalNetPayable: z.number().nonnegative(),
});
export type PayoutQueue = z.infer<typeof PayoutQueueSchema>;

export const ApprovePayoutsResponseSchema = z.object({
  approved: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z.array(z.object({ technicianId: z.string(), reason: z.string() })),
});
export type ApprovePayoutsResponse = z.infer<typeof ApprovePayoutsResponseSchema>;

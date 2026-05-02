import { z } from 'zod';

export const WalletLedgerPayoutStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED']);
export type WalletLedgerPayoutStatus = z.infer<typeof WalletLedgerPayoutStatusSchema>;

export const PayoutCadenceSchema = z.enum(['WEEKLY', 'NEXT_DAY', 'INSTANT']);
export type PayoutCadence = z.infer<typeof PayoutCadenceSchema>;

export const WalletLedgerEntrySchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  technicianId: z.string(),
  partitionKey: z.string(),
  bookingAmount: z.number().int().positive(),
  completedJobCountAtSettlement: z.number().int().nonnegative(),
  commissionBps: z.number().int().positive(),
  commissionAmount: z.number().int().nonnegative(),
  techAmount: z.number().int().positive(),
  payoutStatus: WalletLedgerPayoutStatusSchema,
  razorpayTransferId: z.string().optional(),
  failureReason: z.string().optional(),
  createdAt: z.string(),
  settledAt: z.string().optional(),
  payoutCadence: PayoutCadenceSchema.optional(),
  payoutFeeAmount: z.number().int().nonnegative().optional(),
  heldForCadence: z.boolean().optional(),
});

export type WalletLedgerEntry = z.infer<typeof WalletLedgerEntrySchema>;

export type WalletLedgerCreateInput = {
  bookingId: string;
  technicianId: string;
  bookingAmount: number;
  completedJobCountAtSettlement: number;
  commissionBps: number;
  commissionAmount: number;
  techAmount: number;
  payoutCadence?: PayoutCadence;
  payoutFeeAmount?: number;
  heldForCadence?: boolean;
};

export const EarningsPeriodSchema = z.object({
  techAmount: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});
export type EarningsPeriod = z.infer<typeof EarningsPeriodSchema>;

export const DailyEarningsSchema = z.object({
  date: z.string(),
  techAmount: z.number().int().nonnegative(),
});
export type DailyEarnings = z.infer<typeof DailyEarningsSchema>;

export const EarningsResponseSchema = z.object({
  today: EarningsPeriodSchema,
  week: EarningsPeriodSchema,
  month: EarningsPeriodSchema,
  lifetime: EarningsPeriodSchema,
  lastSevenDays: z.array(DailyEarningsSchema),
  pendingHeld: z.number().int().nonnegative(),
});
export type EarningsResponse = z.infer<typeof EarningsResponseSchema>;

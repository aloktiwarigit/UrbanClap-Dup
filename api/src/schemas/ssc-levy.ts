import { z } from 'zod';

export const SscLevyStatusSchema = z.enum([
  'PENDING_APPROVAL',
  'APPROVED',
  'TRANSFERRED',
  'FAILED',
]);

export const SscLevyDocSchema = z.object({
  id: z.string().uuid(),
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/),
  gmv: z.number().int().nonnegative(),
  levyRate: z.union([z.literal(0.01), z.literal(0.02)]),
  levyAmount: z.number().int().nonnegative(),
  status: SscLevyStatusSchema,
  razorpayTransferId: z.string().optional(),
  approvedAt: z.string().optional(),
  transferredAt: z.string().optional(),
  createdAt: z.string(),
});

export type SscLevyDoc = z.infer<typeof SscLevyDocSchema>;
export type SscLevyStatus = z.infer<typeof SscLevyStatusSchema>;

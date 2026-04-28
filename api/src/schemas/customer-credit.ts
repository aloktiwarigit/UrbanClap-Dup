import { z } from 'zod';

export const CustomerCreditDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  bookingId: z.string(),
  amount: z.number().int().positive(),
  reason: z.literal('NO_SHOW'),
  createdAt: z.string(),
});

export type CustomerCreditDoc = z.infer<typeof CustomerCreditDocSchema>;

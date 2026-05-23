import { z } from 'zod';

export const SlotHoldDocSchema = z.object({
  id: z.string(),                     // "<serviceId>|<date>|<window>"
  servicePartitionKey: z.string(),    // "<serviceId>|<date>"
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  window: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  customerId: z.string(),
  heldAt: z.string().datetime(),
  bookingId: z.string().optional(),   // set on commitHold; absent = soft hold
  ttl: z.number().int().optional(),   // -1 when committed; absent = container default
});

export type SlotHoldDoc = z.infer<typeof SlotHoldDocSchema>;

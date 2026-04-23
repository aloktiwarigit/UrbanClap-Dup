import { z } from 'zod';

export const BookingEventDocSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  event: z.string(),
  technicianId: z.string().optional(),
  adminId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ts: z.string().datetime(),
});

export type BookingEventDoc = z.infer<typeof BookingEventDocSchema>;

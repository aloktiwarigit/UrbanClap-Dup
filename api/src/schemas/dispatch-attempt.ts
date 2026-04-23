import { z } from 'zod';

export const DispatchAttemptStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']);

export const DispatchAttemptDocSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  technicianIds: z.array(z.string()),
  sentAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  status: DispatchAttemptStatusSchema,
});

export type DispatchAttemptDoc = z.infer<typeof DispatchAttemptDocSchema>;
export type DispatchAttemptStatus = z.infer<typeof DispatchAttemptStatusSchema>;

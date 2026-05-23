import { z } from 'zod';

export const WaitlistRequestSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Must be a valid +91 mobile number'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  serviceId: z.string().min(1).max(64),
  requestedAt: z.string().datetime(),
});

export type WaitlistRequest = z.infer<typeof WaitlistRequestSchema>;

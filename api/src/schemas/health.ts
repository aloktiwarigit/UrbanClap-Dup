import { z } from 'zod';

export const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
    version: z.string().min(1),
    commit: z.string().min(1),
    timestamp: z.string().datetime({ offset: false }),
    uptimeSeconds: z.number().nonnegative(),
  })
  .strict();

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

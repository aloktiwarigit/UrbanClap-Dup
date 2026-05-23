import { z } from 'zod';

export const DeviceTokenSchema = z.object({
  userId:      z.string().min(1),
  userType:    z.enum(['customer', 'technician', 'admin']),
  deviceToken: z.string().min(100).max(4096),
  platform:    z.enum(['android', 'web']),
  lastSeen:    z.string().datetime(),
  appBuild:    z.string().optional(),
});

export type DeviceTokenDoc = z.infer<typeof DeviceTokenSchema> & { id: string };

/** Body accepted by POST /device-tokens/register */
export const RegisterDeviceTokenBodySchema = z.object({
  deviceToken: z.string().min(100).max(4096),
  platform:    z.enum(['android', 'web']),
  appBuild:    z.string().optional(),
});

export type RegisterDeviceTokenBody = z.infer<typeof RegisterDeviceTokenBodySchema>;

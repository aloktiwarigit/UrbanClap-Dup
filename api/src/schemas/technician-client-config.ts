import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const TECHNICIAN_CLIENT_CONFIG_DOC_ID = 'technician-client-config';
export const TechnicianFeatureFlagsSchema = z.object({
  wallet: z.boolean(), duesBanner: z.boolean(), upiQr: z.boolean(), incentives: z.boolean(), addOnRequests: z.boolean(),
});
export const DEFAULT_TECHNICIAN_FEATURES = { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false } as const;

export const TechnicianClientConfigDocSchema = z.object({
  id: z.literal(TECHNICIAN_CLIENT_CONFIG_DOC_ID),
  features: TechnicianFeatureFlagsSchema.partial().optional(),
  minSupportedVersionCode: z.number().int().nonnegative().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type TechnicianClientConfigDoc = z.infer<typeof TechnicianClientConfigDocSchema>;

export const UpdateTechnicianClientConfigBodySchema = z.object({
  features: TechnicianFeatureFlagsSchema.partial().optional(),
  minSupportedVersionCode: z.number().int().nonnegative().optional(),
}).strict().refine((b) => Object.keys(b).length > 0, { message: 'empty patch' });

export const TechnicianConfigResponseSchema = z.object({
  features: TechnicianFeatureFlagsSchema,
  thresholds: z.object({ warnPaise: z.number().int(), blockPaise: z.number().int() }),
  holdEnforcementEnabled: z.boolean(),
  incentive: z.object({ enabled: z.boolean(), milestones: z.array(z.object({ jobs: z.number().int(), bonusPaise: z.number().int() })), capFractionBps: z.number().int() }),
  minSupportedVersionCode: z.number().int(),
  serverTime: z.string(),
});
export type TechnicianConfigResponse = z.infer<typeof TechnicianConfigResponseSchema>;

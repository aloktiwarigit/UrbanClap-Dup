import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

/** Fixed singleton id for the platform commission-config document in the `system` container. */
export const COMMISSION_CONFIG_DOC_ID = 'commission-config';

export const MIN_COMMISSION_BPS = 1500;
export const MAX_COMMISSION_BPS = 3500;

/** Commission rate in basis points (2250 = 22.5%). Shared bound across global/category/service. */
export const CommissionBpsSchema = z
  .number()
  .int()
  .min(MIN_COMMISSION_BPS)
  .max(MAX_COMMISSION_BPS);

/** Where the effective commission rate was resolved from (E21-S01 cascade). */
export const CommissionResolvedFromSchema = z.enum(['SERVICE', 'CATEGORY', 'GLOBAL']);
export type CommissionResolvedFrom = z.infer<typeof CommissionResolvedFromSchema>;

export const DEFAULT_WARN_THRESHOLD_PAISE = 250_000;
export const DEFAULT_BLOCK_THRESHOLD_PAISE = 500_000;

/** Stored in the `system` Cosmos container under the fixed id `commission-config`. */
export const CommissionConfigDocSchema = z
  .object({
    id: z.literal(COMMISSION_CONFIG_DOC_ID),
    defaultCommissionBps: CommissionBpsSchema,
    updatedBy: z.string().min(1),
    updatedAt: z.string().datetime(),
    warnThresholdPaise: z.number().int().nonnegative().optional(),
    blockThresholdPaise: z.number().int().positive().optional(),
    holdEnforcementEnabled: z.boolean().optional(),
    enforceKycInDispatch: z.boolean().optional(),
  })
  .strict();
export type CommissionConfigDoc = z.infer<typeof CommissionConfigDocSchema>;

/** Admin PUT body to change the global default commission and derived thresholds/toggles. */
export const UpdateCommissionConfigBodySchema = z
  .object({
    defaultCommissionBps: CommissionBpsSchema.optional(),
    warnThresholdPaise: z.number().int().nonnegative().optional(),
    blockThresholdPaise: z.number().int().positive().optional(),
    holdEnforcementEnabled: z.boolean().optional(),
    enforceKycInDispatch: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'empty patch' })
  .refine((b) => b.warnThresholdPaise === undefined || b.blockThresholdPaise === undefined || b.warnThresholdPaise < b.blockThresholdPaise,
    { message: 'warnThresholdPaise must be below blockThresholdPaise' });
export type UpdateCommissionConfigBody = z.infer<typeof UpdateCommissionConfigBodySchema>;

/** Fully-resolved commission config with every default applied — never has undefined fields. */
export const EffectiveCommissionConfigSchema = z.object({
  defaultCommissionBps: CommissionBpsSchema,
  warnThresholdPaise: z.number().int().nonnegative(),
  blockThresholdPaise: z.number().int().positive(),
  holdEnforcementEnabled: z.boolean(),
  enforceKycInDispatch: z.boolean(),
  updatedBy: z.string(),
  updatedAt: z.string(),
  isDefault: z.boolean().optional(),
});
export type EffectiveCommissionConfig = z.infer<typeof EffectiveCommissionConfigSchema>;

/** Admin GET response for the global default commission (alias kept for the OpenAPI registry). */
export const CommissionConfigResponseSchema = EffectiveCommissionConfigSchema;
export type CommissionConfigResponse = z.infer<typeof CommissionConfigResponseSchema>;

export function toEffectiveConfig(doc: CommissionConfigDoc | null): EffectiveCommissionConfig {
  return {
    defaultCommissionBps: doc?.defaultCommissionBps ?? 2200,
    warnThresholdPaise: doc?.warnThresholdPaise ?? DEFAULT_WARN_THRESHOLD_PAISE,
    blockThresholdPaise: doc?.blockThresholdPaise ?? DEFAULT_BLOCK_THRESHOLD_PAISE,
    holdEnforcementEnabled: doc?.holdEnforcementEnabled ?? false,
    enforceKycInDispatch: doc?.enforceKycInDispatch ?? false,
    updatedBy: doc?.updatedBy ?? 'system',
    updatedAt: doc?.updatedAt ?? new Date(0).toISOString(),
    ...(doc ? {} : { isDefault: true }),
  };
}

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

/** Stored in the `system` Cosmos container under the fixed id `commission-config`. */
export const CommissionConfigDocSchema = z
  .object({
    id: z.literal(COMMISSION_CONFIG_DOC_ID),
    defaultCommissionBps: CommissionBpsSchema,
    updatedBy: z.string().min(1),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type CommissionConfigDoc = z.infer<typeof CommissionConfigDocSchema>;

/** Admin PUT body to change the global default commission. */
export const UpdateCommissionConfigBodySchema = z
  .object({
    defaultCommissionBps: CommissionBpsSchema,
  })
  .strict();
export type UpdateCommissionConfigBody = z.infer<typeof UpdateCommissionConfigBodySchema>;

/** Admin GET response for the global default commission. */
export const CommissionConfigResponseSchema = z.object({
  defaultCommissionBps: CommissionBpsSchema,
  updatedBy: z.string().min(1),
  updatedAt: z.string().datetime(),
});
export type CommissionConfigResponse = z.infer<typeof CommissionConfigResponseSchema>;

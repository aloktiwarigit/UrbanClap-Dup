import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { rejectPriceInProse } from './service.js';

extendZodWithOpenApi(z);

export const ServiceCategorySchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/).openapi({ example: 'ac-repair' }),
    // No price-in-prose refine here: stored-document schemas must parse legacy data.
    // The rule is enforced on the write bodies below (see PRICE_IN_PROSE in service.ts).
    name: z.string().min(1).max(100).openapi({ example: 'AC Repair' }),
    /** E22-S01: Hindi display name — see the note on ServiceSchema.nameHi. */
    nameHi: z.string().min(1).max(100).optional().openapi({ example: 'एसी मरम्मत' }),
    heroImageUrl: z.string().url(),
    sortOrder: z.number().int().nonnegative(),
    /** PRD-08: When true, this category's services should trigger the women-safe filter by default. */
    safetyTag: z.boolean().optional(),
    /**
     * E21-S01: Optional commission override (basis points) for every service in this category.
     * When absent, services fall through to the global default. A service-level `commissionBps`
     * takes precedence over this category override.
     */
    commissionBps: z.number().int().min(1500).max(3500).optional(),
    isActive: z.boolean(),
    updatedBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const CreateCategoryBodySchema = rejectPriceInProse(
  ServiceCategorySchema.omit({
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  }),
);

/** P0-3: PATCH semantics — see the note on `UpdateServiceBodySchema`. */
export const UpdateCategoryBodySchema = rejectPriceInProse(
  ServiceCategorySchema.omit({
    id: true,
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  }).partial(),
);

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>;

import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { rejectPriceInProse } from './service.js';
import { CommissionBpsSchema } from './commission-config.js';

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

/**
 * P0-3: PATCH semantics — see the note on `UpdateServiceBodySchema`.
 *
 * E21-S03 task 9 (commission console settings page): `commissionBps` is widened to
 * `.nullable()` on this WRITE body only — `ServiceCategorySchema` above stays plain
 * `.optional()`, and the read/stored shape is unchanged. This is deliberate, narrowly
 * scoped surgery, not a blast-radius fix: the settings UI needs a way to say "clear
 * this category's override and inherit the global rate again", and omission cannot
 * express that (PATCH semantics treat an absent key as "leave unchanged", not
 * "remove"). An explicit `null` is the one wire value available to mean "delete this
 * key" without redefining what omission means for every other field on this schema
 * or in the sibling `UpdateServiceBodySchema` / commission-config / system-docs patch
 * bodies that also rely on "absent = unchanged". `CatalogueRepository.updateCategory`
 * is the only place that interprets this `null` — it deletes the stored key rather
 * than writing a literal `null`, so a cleared category still parses against the
 * plain-`.optional()` `ServiceCategorySchema` and "absent" keeps meaning "inherit the
 * global default" exactly as the field's own doc comment above already promises.
 */
export const UpdateCategoryBodySchema = rejectPriceInProse(
  ServiceCategorySchema.omit({
    id: true,
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  })
    .partial()
    .extend({
      // Fix round 1 (minor): derived from the shared `CommissionBpsSchema` (same 1500-3500 bound
      // the global rate and service-level override use) rather than re-declaring the literals, so
      // a later re-narrowing of that bound cannot leave this write body stale.
      commissionBps: CommissionBpsSchema.nullable().optional(),
    }),
);

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>;

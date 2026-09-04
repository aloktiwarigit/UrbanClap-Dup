import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const AddOnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  triggerCondition: z.string().min(1),
});

const PhotoStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean(),
});

const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const ServiceSchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/).openapi({ example: 'ac-deep-clean' }),
    categoryId: z.string().min(1),
    name: z.string().min(1).max(100),
    shortDescription: z.string().min(1).max(200),
    heroImageUrl: z.string().url(),
    basePrice: z.number().int().nonnegative().openapi({ description: 'Price in paise (₹599 = 59900)' }),
    commissionBps: z.number().int().min(1500).max(3500).optional().openapi({ description: 'Commission override in basis points (2250 = 22.5%). Optional (E21-S01): when absent, the booking falls through to the category override, then the global default.' }),
    durationMinutes: z.number().int().positive(),
    includes: z.array(z.string().min(1)),
    faq: z.array(FaqItemSchema),
    addOns: z.array(AddOnSchema),
    photoStages: z.array(PhotoStageSchema),
    isActive: z.boolean(),
    updatedBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    // E16-S02: optional scheduling window; defaults applied server-side (08:00 / 20:00)
    workStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    workEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })
  .strict();

export const ServiceCardSchema = ServiceSchema.pick({
  id: true,
  categoryId: true,
  name: true,
  shortDescription: true,
  heroImageUrl: true,
  basePrice: true,
  durationMinutes: true,
}).strip();

export const ServiceDetailSchema = ServiceSchema.omit({
  commissionBps: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
}).strip();

export const CreateServiceBodySchema = ServiceSchema.omit({
  isActive: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * P0-3: PATCH semantics. Every field is optional — the repository merges the supplied
 * keys over the stored document and leaves the rest untouched.
 *
 * This was previously a non-partial `.omit()`, which made `includes`, `faq`, `addOns`
 * and `photoStages` REQUIRED on every update. The admin form satisfied that by sending
 * `[]` for all four, so saving a price change silently wiped the add-ons, FAQ,
 * "includes" bullets and — worst — `photoStages`, which drives the technician
 * guided-photo flow (E06-S02).
 *
 * The route is still PUT for client compatibility, but the body is a partial patch.
 * Sending an explicit `[]` still clears a field: omission and clearing are distinct.
 */
export const UpdateServiceBodySchema = ServiceSchema.omit({
  id: true,
  categoryId: true,
  isActive: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type Service = z.infer<typeof ServiceSchema>;
export type ServiceCard = z.infer<typeof ServiceCardSchema>;
export type ServiceDetail = z.infer<typeof ServiceDetailSchema>;
export type CreateServiceBody = z.infer<typeof CreateServiceBodySchema>;
export type UpdateServiceBody = z.infer<typeof UpdateServiceBodySchema>;

// E16-S02: Slot availability response schemas
export const SlotWindowSchema = z.object({
  window: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
  available: z.boolean(),
});

export const AvailabilityResponseSchema = z.object({
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotGranularityMinutes: z.number().int().positive(),
  slots: z.array(SlotWindowSchema),
});

export type SlotWindow = z.infer<typeof SlotWindowSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;

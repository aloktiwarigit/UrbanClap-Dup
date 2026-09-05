import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

/**
 * E22-S01 Codex finding: catalogue prose (names, descriptions) must never carry a
 * price literal. Prices are rendered from `basePrice` at read time; a price typed
 * into free text goes stale the instant the owner edits the price and reintroduces
 * the exact defect this story removes. Shared with service-category.ts.
 *
 * HOTFIX (2026-09-05): this rule is enforced on the WRITE bodies only
 * (`CreateServiceBodySchema` / `UpdateServiceBodySchema`), never on the stored-document
 * schemas that the public read handlers parse. Applying it to `ServiceSchema` took the
 * catalogue home down in production: documents seeded before the reprice still carry
 * "₹599" / "₹699" / "₹250/m" in prose, and `ServiceCardSchema.parse` threw on every
 * read until the seed was re-run. A read path must never reject data it did not write.
 */
export const PRICE_IN_PROSE = /[₹]|\bRs\.?\b|\bINR\b|रुपये|रुपए|रुपया|रु\./;
export const PRICE_IN_PROSE_MESSAGE = 'Prices must not appear in text; they are rendered from basePrice';

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

/** Every prose field a service write body can carry, with its issue path. */
type ServiceProseCarrier = {
  name?: string;
  nameHi?: string;
  shortDescription?: string;
  shortDescriptionHi?: string;
  includes?: string[];
  faq?: Array<{ question: string; answer: string }>;
  addOns?: Array<{ name: string; triggerCondition: string }>;
  photoStages?: Array<{ label: string }>;
};

function collectServiceProse(body: ServiceProseCarrier): Array<{ path: (string | number)[]; text: string }> {
  const out: Array<{ path: (string | number)[]; text: string }> = [];
  for (const key of ['name', 'nameHi', 'shortDescription', 'shortDescriptionHi'] as const) {
    const v = body[key];
    if (typeof v === 'string') out.push({ path: [key], text: v });
  }
  body.includes?.forEach((text, i) => out.push({ path: ['includes', i], text }));
  body.faq?.forEach((f, i) => {
    out.push({ path: ['faq', i, 'question'], text: f.question });
    out.push({ path: ['faq', i, 'answer'], text: f.answer });
  });
  body.addOns?.forEach((a, i) => {
    out.push({ path: ['addOns', i, 'name'], text: a.name });
    out.push({ path: ['addOns', i, 'triggerCondition'], text: a.triggerCondition });
  });
  body.photoStages?.forEach((p, i) => out.push({ path: ['photoStages', i, 'label'], text: p.label }));
  return out;
}

/**
 * Wrap a WRITE body schema so any prose field carrying a price figure is rejected with
 * a per-field issue. Applied to create/update bodies only — see the note on PRICE_IN_PROSE.
 */
export const rejectPriceInProse = <Out, Def extends z.ZodTypeDef, In>(schema: z.ZodType<Out, Def, In>) =>
  schema.superRefine((body: Out, ctx: z.RefinementCtx) => {
    for (const { path, text } of collectServiceProse(body as ServiceProseCarrier)) {
      if (PRICE_IN_PROSE.test(text)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: PRICE_IN_PROSE_MESSAGE });
      }
    }
  });

export const ServiceSchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/).openapi({ example: 'ac-deep-clean' }),
    categoryId: z.string().min(1),
    name: z.string().min(1).max(100),
    /**
     * E22-S01: Hindi display name. The customer app is Hindi-default (ADR-0018) and
     * previously read Hindi from a compiled-in Kotlin map, so anything added through
     * the admin dashboard showed in English until a new APK shipped. Optional so
     * existing documents keep parsing; the parity guard in tools/ fails CI if a
     * seeded service is missing one.
     */
    nameHi: z.string().min(1).max(100).optional(),
    shortDescription: z.string().min(1).max(200),
    /** E22-S01: Hindi short description. Must never contain a price — see Task 3 and the write-body guard. */
    shortDescriptionHi: z.string().min(1).max(200).optional(),
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
  nameHi: true,
  shortDescription: true,
  shortDescriptionHi: true,
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

export const CreateServiceBodySchema = rejectPriceInProse(
  ServiceSchema.omit({
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  }),
);

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
export const UpdateServiceBodySchema = rejectPriceInProse(
  ServiceSchema.omit({
    id: true,
    categoryId: true,
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  }).partial(),
);

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

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
    commissionBps: z.number().int().min(1500).max(3500).openapi({ description: 'Commission in basis points (2250 = 22.5%)' }),
    durationMinutes: z.number().int().positive(),
    includes: z.array(z.string().min(1)),
    faq: z.array(FaqItemSchema),
    addOns: z.array(AddOnSchema),
    photoStages: z.array(PhotoStageSchema),
    isActive: z.boolean(),
    updatedBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
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

export const UpdateServiceBodySchema = ServiceSchema.omit({
  id: true,
  categoryId: true,
  isActive: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export type Service = z.infer<typeof ServiceSchema>;
export type ServiceCard = z.infer<typeof ServiceCardSchema>;
export type ServiceDetail = z.infer<typeof ServiceDetailSchema>;
export type CreateServiceBody = z.infer<typeof CreateServiceBodySchema>;
export type UpdateServiceBody = z.infer<typeof UpdateServiceBodySchema>;

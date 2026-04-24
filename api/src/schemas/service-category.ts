import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ServiceCategorySchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/).openapi({ example: 'ac-repair' }),
    name: z.string().min(1).max(100).openapi({ example: 'AC Repair' }),
    heroImageUrl: z.string().url(),
    sortOrder: z.number().int().nonnegative(),
    isActive: z.boolean(),
    updatedBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const CreateCategoryBodySchema = ServiceCategorySchema.omit({
  isActive: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCategoryBodySchema = ServiceCategorySchema.omit({
  id: true,
  isActive: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type CreateCategoryBody = z.infer<typeof CreateCategoryBodySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategoryBodySchema>;

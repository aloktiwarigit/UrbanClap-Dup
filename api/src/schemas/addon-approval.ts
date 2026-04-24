import { z } from 'zod';

export const PendingAddOnSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  triggerDescription: z.string().min(1),
});

export const RequestAddOnBodySchema = PendingAddOnSchema;

export const ApproveAddOnsBodySchema = z.object({
  decisions: z.array(z.object({ name: z.string().min(1), approved: z.boolean() })).min(1),
});

export type PendingAddOn = z.infer<typeof PendingAddOnSchema>;
export type AddOnDecision = { name: string; approved: boolean };

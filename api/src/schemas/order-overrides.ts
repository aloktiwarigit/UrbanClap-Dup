import { z } from 'zod';

export const ReassignBodySchema = z.object({
  technicianId: z.string().min(1),
  reason: z.string().min(5),
});

export const CompleteBodySchema = z.object({
  reason: z.string().min(5),
});

export const RefundBodySchema = z.object({
  reason: z.string().min(5),
  amountPaise: z.number().int().positive().optional(),
});

export const WaiveFeeBodySchema = z.object({
  reason: z.string().min(5),
});

export const EscalateBodySchema = z.object({
  reason: z.string().min(5),
  priority: z.enum(['HIGH', 'CRITICAL']),
});

export const NoteBodySchema = z.object({
  note: z.string().min(1),
});

export type ReassignBody = z.infer<typeof ReassignBodySchema>;
export type CompleteBody = z.infer<typeof CompleteBodySchema>;
export type RefundBody = z.infer<typeof RefundBodySchema>;
export type WaiveFeeBody = z.infer<typeof WaiveFeeBodySchema>;
export type EscalateBody = z.infer<typeof EscalateBodySchema>;
export type NoteBody = z.infer<typeof NoteBodySchema>;

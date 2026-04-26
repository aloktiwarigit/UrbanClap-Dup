import { z } from 'zod';

export const ShieldReportBodySchema = z.object({
  bookingId: z.string().min(1),
  description: z.string().max(500).optional(),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});
export type ShieldReportBody = z.infer<typeof ShieldReportBodySchema>;

export const RatingAppealBodySchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().min(20).max(500),
  evidenceUrls: z.array(z.string().url()).max(5).optional(),
});
export type RatingAppealBody = z.infer<typeof RatingAppealBodySchema>;

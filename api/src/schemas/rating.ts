import { z } from 'zod';

const Stars = z.number().int().min(1).max(5);

export const CustomerSubScoresSchema = z.object({
  punctuality: Stars,
  skill: Stars,
  behaviour: Stars,
});
export const TechSubScoresSchema = z.object({
  behaviour: Stars,
  communication: Stars,
});

export const SubmitRatingRequestSchema = z.discriminatedUnion('side', [
  z.object({
    side: z.literal('CUSTOMER_TO_TECH'),
    bookingId: z.string().min(1),
    overall: Stars,
    subScores: CustomerSubScoresSchema,
    comment: z.string().max(500).optional(),
  }),
  z.object({
    side: z.literal('TECH_TO_CUSTOMER'),
    bookingId: z.string().min(1),
    overall: Stars,
    subScores: TechSubScoresSchema,
    comment: z.string().max(500).optional(),
  }),
]);

export const RatingDocSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  customerId: z.string(),
  technicianId: z.string(),
  customerOverall: Stars.optional(),
  customerSubScores: CustomerSubScoresSchema.optional(),
  customerComment: z.string().optional(),
  customerSubmittedAt: z.string().optional(),
  techOverall: Stars.optional(),
  techSubScores: TechSubScoresSchema.optional(),
  techComment: z.string().optional(),
  techSubmittedAt: z.string().optional(),
  revealedAt: z.string().optional(),
});

export const SidePayloadSchema = z.union([
  z.object({ status: z.literal('PENDING') }),
  z.object({
    status: z.literal('SUBMITTED'),
    overall: Stars,
    subScores: z.union([CustomerSubScoresSchema, TechSubScoresSchema]),
    comment: z.string().optional(),
    submittedAt: z.string(),
  }),
]);

export const GetRatingResponseSchema = z.object({
  bookingId: z.string(),
  status: z.enum(['PENDING', 'PARTIALLY_SUBMITTED', 'REVEALED']),
  revealedAt: z.string().optional(),
  customerSide: SidePayloadSchema,
  techSide: SidePayloadSchema,
});

export type CustomerSubScores = z.infer<typeof CustomerSubScoresSchema>;
export type TechSubScores = z.infer<typeof TechSubScoresSchema>;
export type SubmitRatingRequest = z.infer<typeof SubmitRatingRequestSchema>;
export type RatingDoc = z.infer<typeof RatingDocSchema>;
export type GetRatingResponse = z.infer<typeof GetRatingResponseSchema>;

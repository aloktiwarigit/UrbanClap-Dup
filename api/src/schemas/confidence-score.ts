import { z } from 'zod';

export const ConfidenceScoreQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const ConfidenceScoreResponseSchema = z.object({
  onTimePercent: z.number().min(0).max(100),
  areaRating: z.number().min(0).max(5).nullable(),
  nearestEtaMinutes: z.number().min(0).nullable(),
  dataPointCount: z.number().int().nonnegative(),
  isLimitedData: z.boolean(),
});

export type ConfidenceScoreQuery = z.infer<typeof ConfidenceScoreQuerySchema>;
export type ConfidenceScoreResponse = z.infer<typeof ConfidenceScoreResponseSchema>;

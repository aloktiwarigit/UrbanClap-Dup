import { z } from 'zod';

export const TechnicianReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  text: z.string(),
  date: z.string().datetime(),
});

export const TechnicianDossierSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  photoUrl: z.string().url().optional(),
  verifiedAadhaar: z.boolean().default(false),
  verifiedPoliceCheck: z.boolean().default(false),
  trainingInstitution: z.string().optional(),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  yearsInService: z.number().int().min(0).default(0),
  totalJobsCompleted: z.number().int().min(0).default(0),
  lastReviews: z.array(TechnicianReviewSchema).max(3).default([]),
});

export type TechnicianReview = z.infer<typeof TechnicianReviewSchema>;
export type TechnicianDossier = z.infer<typeof TechnicianDossierSchema>;

import { z } from 'zod';

export const TechnicianProfileSchema = z.object({
  id: z.string(),
  firebaseUid: z.string(),
  displayName: z.string(),
  phoneNumber: z.string(),
  profilePhotoUrl: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
  updatedAt: z.string(),
  completedJobCount: z.number().int().nonnegative().default(0),
});

export type TechnicianProfile = z.infer<typeof TechnicianProfileSchema>;

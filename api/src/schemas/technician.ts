import { z } from 'zod';

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export const AvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
});

export const TechnicianKycStatusSchema = z.enum(['APPROVED', 'PENDING', 'REJECTED']);

export const TechnicianProfileSchema = z.object({
  id: z.string().min(1),
  technicianId: z.string().min(1),
  location: GeoPointSchema,
  skills: z.array(z.string().min(1)).min(1),
  availabilityWindows: z.array(AvailabilityWindowSchema),
  isOnline: z.boolean(),
  isAvailable: z.boolean(),
  kycStatus: TechnicianKycStatusSchema,
  fcmToken: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  completedJobCount: z.number().int().min(0).optional(),
  updatedAt: z.string().datetime().optional(),
  blockedCustomerIds: z.array(z.string()).optional(),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;
export type TechnicianKycStatus = z.infer<typeof TechnicianKycStatusSchema>;
export type TechnicianProfile = z.infer<typeof TechnicianProfileSchema>;

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

export const HoldStateSchema = z.enum(['CLEAR', 'WARN', 'BLOCKED']);
export type HoldState = z.infer<typeof HoldStateSchema>;
export const CommissionHoldSchema = z.object({
  outstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  oldestDueAt: z.string().optional(),
  state: HoldStateSchema,
  evaluatedAt: z.string(),
  override: z.object({ until: z.string(), byAdminId: z.string(), reason: z.string() }).optional(),
});
export type CommissionHold = z.infer<typeof CommissionHoldSchema>;
export const PaymentProfileSchema = z.object({ upiVpa: z.string(), upiUpdatedAt: z.string() });
export type PaymentProfile = z.infer<typeof PaymentProfileSchema>;

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
  /**
   * Set by patchTechnicianAdminFields when an admin suspends a technician. Absent on every
   * document written before E21-S04, which is why every predicate that reads it must be written
   * `(NOT IS_DEFINED(c.suspended) OR c.suspended != true)` — a bare `!=` drops undefined rows.
   */
  suspended: z.boolean().optional(),
  payoutCadence: z.enum(['WEEKLY', 'NEXT_DAY', 'INSTANT']).optional(),
  payoutCadenceUpdatedAt: z.string().optional(),
  commissionHold: CommissionHoldSchema.optional(),
  paymentProfile: PaymentProfileSchema.optional(),
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type AvailabilityWindow = z.infer<typeof AvailabilityWindowSchema>;
export type TechnicianKycStatus = z.infer<typeof TechnicianKycStatusSchema>;
export type TechnicianProfile = z.infer<typeof TechnicianProfileSchema>;

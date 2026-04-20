import { z } from 'zod';

export const KycStatusSchema = z.enum([
  'PENDING', 'AADHAAR_DONE', 'PAN_DONE', 'COMPLETE', 'PENDING_MANUAL', 'MANUAL_REVIEW',
]);

export const TechnicianKycSchema = z.object({
  aadhaarVerified: z.boolean(),
  aadhaarMaskedNumber: z.string().nullable(),
  panNumber: z.string().nullable(),
  panImagePath: z.string().nullable(),
  kycStatus: KycStatusSchema,
  updatedAt: z.string().datetime(),
});

export type KycStatus = z.infer<typeof KycStatusSchema>;
export type TechnicianKyc = z.infer<typeof TechnicianKycSchema>;

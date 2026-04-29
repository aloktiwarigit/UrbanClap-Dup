import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const KycStatusSchema = z.enum([
  'PENDING', 'AADHAAR_DONE', 'PAN_DONE', 'COMPLETE', 'PENDING_MANUAL', 'MANUAL_REVIEW',
]);

export const EncryptedPanSchema = z.object({
  iv: z.string(),
  ciphertext: z.string(),
  tag: z.string(),
  v: z.literal(1),
});

export const TechnicianKycSchema = z.object({
  aadhaarVerified: z.boolean(),
  aadhaarMaskedNumber: z.string().nullable(),
  panNumber: z.string().nullable(),
  panImagePath: z.string().nullable(),
  panNumberEncrypted: EncryptedPanSchema.optional(),
  kycStatus: KycStatusSchema,
  updatedAt: z.string().datetime(),
});

export const SubmitAadhaarRequestSchema = z.object({
  technicianId: z.string().min(1),
  authCode: z.string(),
  redirectUri: z.string().url(),
});

export const SubmitAadhaarResponseSchema = z.object({
  kycStatus: KycStatusSchema,
  aadhaarMaskedNumber: z.string().nullable(),
  aadhaarVerified: z.boolean(),
});

export const SubmitPanOcrRequestSchema = z.object({
  technicianId: z.string().min(1),
  firebaseStoragePath: z.string().min(1),
});

export const SubmitPanOcrResponseSchema = z.object({
  kycStatus: KycStatusSchema,
  panNumber: z.string().nullable(),
});

export const GetKycStatusResponseSchema = z.object({
  technicianId: z.string(),
  kycStatus: KycStatusSchema,
  aadhaarVerified: z.boolean(),
  aadhaarMaskedNumber: z.string().nullable(),
  panNumber: z.string().nullable(),
});

export type EncryptedPan = z.infer<typeof EncryptedPanSchema>;
export type TechnicianKyc = z.infer<typeof TechnicianKycSchema>;
export type KycStatus = z.infer<typeof KycStatusSchema>;
export type SubmitAadhaarRequest = z.infer<typeof SubmitAadhaarRequestSchema>;
export type SubmitAadhaarResponse = z.infer<typeof SubmitAadhaarResponseSchema>;
export type SubmitPanOcrRequest = z.infer<typeof SubmitPanOcrRequestSchema>;
export type SubmitPanOcrResponse = z.infer<typeof SubmitPanOcrResponseSchema>;
export type GetKycStatusResponse = z.infer<typeof GetKycStatusResponseSchema>;

import { z } from 'zod';

export const LoginRequestSchema = z.object({
  idToken: z.string().min(1),
  totpCode: z.string().regex(/^\d{6}$/).optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SetupTotpVerifySchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/, 'TOTP code must be exactly 6 digits'),
});
export type SetupTotpVerify = z.infer<typeof SetupTotpVerifySchema>;

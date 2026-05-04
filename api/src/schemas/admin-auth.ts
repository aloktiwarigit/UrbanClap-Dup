import { z } from 'zod';

const TotpCodeSchema = z.string().regex(/^\d{6}$/);

export const LoginRequestSchema = z.union([
  z.object({
    idToken: z.string().min(1),
    totpCode: TotpCodeSchema.optional(),
  }),
  z.object({
    challengeToken: z.string().min(1),
    totpCode: TotpCodeSchema,
  }),
]);
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SetupTotpVerifySchema = z.object({
  totpCode: TotpCodeSchema,
});
export type SetupTotpVerify = z.infer<typeof SetupTotpVerifySchema>;

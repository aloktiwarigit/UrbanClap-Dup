import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RevealPartyEnum = z.enum(['CUSTOMER', 'TECHNICIAN']);

/** Write body — strict, per the read-widen/write-strict invariant. */
export const RevealContactBodySchema = z
  .object({
    party: RevealPartyEnum,
  })
  .strict();

export const RevealContactResponseSchema = z.object({
  party: RevealPartyEnum,
  /** The full, unmasked number. This is the only field in the API that carries one. */
  phone: z.string(),
  revealedAt: z.string(),
});

export type RevealParty = z.infer<typeof RevealPartyEnum>;
export type RevealContactBody = z.infer<typeof RevealContactBodySchema>;
export type RevealContactResponse = z.infer<typeof RevealContactResponseSchema>;

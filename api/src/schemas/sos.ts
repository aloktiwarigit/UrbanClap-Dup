import { z } from 'zod';

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export const SosIncidentKeyDoc = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  keyB64: z.string().regex(BASE64_RE),
  ivB64: z.string().regex(BASE64_RE),
  storagePath: z.string().regex(/^sos-audio\/[^/]+\/[^/]+\.enc$/),
  createdAt: z.string().datetime(),
  ttl: z.number().int().positive(),
});

export type SosIncidentKeyDoc = z.infer<typeof SosIncidentKeyDoc>;

export const SosKeyUploadRequest = SosIncidentKeyDoc.pick({
  keyB64: true,
  ivB64: true,
  storagePath: true,
});

export type SosKeyUploadRequest = z.infer<typeof SosKeyUploadRequest>;

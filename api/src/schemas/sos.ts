import { z } from 'zod';

// AES-256 key = 32 bytes → 44 base64 chars (43 + one '=' pad: 32 = 10*3+2 → 44 chars)
const KEY_B64_RE = /^[A-Za-z0-9+/]{43}=$/;
// GCM IV = 12 bytes → 16 base64 chars (12 = 4*3, no padding needed)
const IV_B64_RE = /^[A-Za-z0-9+/]{16}$/;

export const SosIncidentKeyDoc = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  keyB64: z.string().regex(KEY_B64_RE, 'keyB64 must be 32-byte AES key in base64 (44 chars, one = pad)'),
  ivB64: z.string().regex(IV_B64_RE, 'ivB64 must be 12-byte GCM IV in base64 (16 chars, no pad)'),
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

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';

/**
 * Mask a PAN for storage and display. Returns null if the format is not
 * canonical (AAAAA9999A). Callers must treat null as unmasked/unsafe and
 * route to MANUAL_REVIEW rather than storing the raw value.
 */
export function maskPan(pan: string): string | null {
  const match = pan.match(/^([A-Za-z]{5})(\d{4})([A-Za-z])$/);
  if (!match) return null;
  return `${match[1]}####${match[3]}`;
}

export interface EncryptedPan {
  iv: string;
  ciphertext: string;
  tag: string;
  v: 1;
}

function getKey(): Buffer {
  const b64 = process.env['COSMOS_PAN_ENCRYPTION_KEY'];
  if (!b64) throw new Error('COSMOS_PAN_ENCRYPTION_KEY env var not set');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('COSMOS_PAN_ENCRYPTION_KEY must be 32 bytes');
  return key;
}

export function encryptPan(plaintext: string): EncryptedPan {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    v: 1,
  };
}

export function decryptPan(blob: EncryptedPan): string {
  const key = getKey();
  const tagBuf = Buffer.from(blob.tag, 'base64');
  if (tagBuf.length !== 16) throw new Error('GCM auth tag must be exactly 16 bytes');
  const decipher = createDecipheriv(ALGO, key, Buffer.from(blob.iv, 'base64'), { authTagLength: 16 });
  decipher.setAuthTag(tagBuf);
  return Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

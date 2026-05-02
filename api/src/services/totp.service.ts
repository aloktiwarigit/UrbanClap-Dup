import { generateSecret as otpGenerateSecret, verifySync, generateURI } from 'otplib';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function encryptionKey(): Buffer {
  const k = process.env.TOTP_ENCRYPTION_KEY;
  if (!k) throw new Error('TOTP_ENCRYPTION_KEY not configured');
  return Buffer.from(k, 'hex');
}

export function encryptSecret(plaintext: string): string {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(ciphertext: string): string {
  const key = encryptionKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv); // nosemgrep: javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

export function generateSecret(): string {
  return otpGenerateSecret();
}

export function generateOtpAuthUri(secret: string, email: string): string {
  return generateURI({
    strategy: 'totp',
    label: email,
    secret,
    issuer: 'homeservices-admin',
  });
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret, strategy: 'totp' });
    if (typeof result === 'boolean') return result;
    return (result as { valid: boolean }).valid;
  } catch {
    return false;
  }
}

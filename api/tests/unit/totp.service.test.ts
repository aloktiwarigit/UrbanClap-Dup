import { describe, it, expect } from 'vitest';

// Must be set before importing the service
process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex

const { encryptSecret, decryptSecret, generateSecret, verifyToken, generateOtpAuthUri } =
  await import('../../src/services/totp.service.js');

describe('totp.service', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips a secret correctly', () => {
      const s = 'JBSWY3DPEHPK3PXP';
      expect(decryptSecret(encryptSecret(s))).toBe(s);
    });

    it('produces different ciphertext each call (random IV)', () => {
      const s = 'JBSWY3DPEHPK3PXP';
      expect(encryptSecret(s)).not.toBe(encryptSecret(s));
    });

    it('throws on a tampered ciphertext (GCM auth tag check)', () => {
      const enc = encryptSecret('secret');
      const buf = Buffer.from(enc, 'base64');
      buf.writeUInt8((buf[30] ?? 0) ^ 0xff, 30); // corrupt a ciphertext byte
      expect(() => decryptSecret(buf.toString('base64'))).toThrow();
    });
  });

  describe('generateSecret', () => {
    it('returns a 32-char base32 string', () => {
      expect(generateSecret()).toMatch(/^[A-Z2-7]{32}$/);
    });
  });

  describe('verifyToken', () => {
    it('accepts a currently valid token', async () => {
      const { generateSync } = await import('otplib');
      const secret = generateSecret();
      const token = generateSync({ secret, strategy: 'totp' }) as string;
      expect(verifyToken(token, secret)).toBe(true);
    });

    it('rejects an obviously wrong token', () => {
      expect(verifyToken('000000', generateSecret())).toBe(false);
    });
  });

  describe('generateOtpAuthUri', () => {
    it('produces a valid otpauth:// URI with issuer', () => {
      const uri = generateOtpAuthUri('JBSWY3DPEHPK3PXP', 'admin@example.com');
      expect(uri).toMatch(/^otpauth:\/\/totp\/homeservices-admin:/);
      expect(uri).toContain('secret=');
    });
  });
});

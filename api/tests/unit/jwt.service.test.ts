import { describe, it, expect } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

const {
  signAccessToken,
  signSetupToken,
  verifyAccessToken,
  verifySetupToken,
} = await import('../../src/services/jwt.service.js');

describe('jwt.service', () => {
  describe('access token', () => {
    it('round-trips with correct payload', async () => {
      const token = await signAccessToken({
        sub: 'adminId-1',
        role: 'super-admin',
        sessionId: 'sess-1',
      });
      const payload = await verifyAccessToken(token);
      expect(payload?.sub).toBe('adminId-1');
      expect(payload?.role).toBe('super-admin');
      expect(payload?.sessionId).toBe('sess-1');
      expect(payload?.type).toBe('access');
    });

    it('returns null for a setup token passed to verifyAccessToken', async () => {
      const token = await signSetupToken({ sub: 'u1', email: 'a@b.com' });
      expect(await verifyAccessToken(token)).toBeNull();
    });

    it('returns null for a tampered token', async () => {
      const token = await signAccessToken({ sub: 'u', role: 'finance', sessionId: 's' });
      expect(await verifyAccessToken(token + 'x')).toBeNull();
    });
  });

  describe('setup token', () => {
    it('round-trips with correct payload', async () => {
      const token = await signSetupToken({ sub: 'u1', email: 'admin@x.com' });
      const payload = await verifySetupToken(token);
      expect(payload?.sub).toBe('u1');
      expect(payload?.email).toBe('admin@x.com');
      expect(payload?.type).toBe('totp-setup');
    });

    it('returns null for an access token passed to verifySetupToken', async () => {
      const token = await signAccessToken({ sub: 'u', role: 'ops-manager', sessionId: 's' });
      expect(await verifySetupToken(token)).toBeNull();
    });
  });
});

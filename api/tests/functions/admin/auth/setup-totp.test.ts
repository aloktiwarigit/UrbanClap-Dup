import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);

vi.mock('../../../../src/services/jwt.service.js', () => ({
  verifySetupToken: vi.fn(),
  signAccessToken: vi.fn(),
}));
vi.mock('../../../../src/services/adminUser.service.js', () => ({
  getAdminUserById: vi.fn(),
  updateAdminUser: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  createAdminSession: vi.fn(),
}));
vi.mock('../../../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../src/services/totp.service.js', () => ({
  generateSecret: vi.fn(),
  generateOtpAuthUri: vi.fn(),
  encryptSecret: vi.fn(),
  decryptSecret: vi.fn(),
  verifyToken: vi.fn(),
}));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

import { setupTotpGetHandler, setupTotpPostHandler } from '../../../../src/functions/admin/auth/setup-totp.js';

const fakeCtx = {} as InvocationContext;

function makeGetReq(headers: Record<string, string> = {}): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/auth/setup-totp',
    method: 'GET',
    headers,
  });
}

function makePostReq(headers: Record<string, string> = {}, body: unknown = { totpCode: '123456' }): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/auth/setup-totp',
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: { string: JSON.stringify(body) },
  });
}

describe('TOTP setup TOFU guard (ADMIN_SETUP_SECRET)', () => {
  const ORIGINAL_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore env var after each test
    if (ORIGINAL_SETUP_SECRET === undefined) {
      delete process.env.ADMIN_SETUP_SECRET;
    } else {
      process.env.ADMIN_SETUP_SECRET = ORIGINAL_SETUP_SECRET;
    }
  });

  describe('when ADMIN_SETUP_SECRET is set', () => {
    beforeEach(() => {
      process.env.ADMIN_SETUP_SECRET = 'supersecret-owner-only';
    });

    it('GET: returns 403 when X-Setup-Secret header is missing', async () => {
      const res = await setupTotpGetHandler(makeGetReq(), fakeCtx);
      expect(res.status).toBe(403);
      expect((res.jsonBody as { code: string }).code).toBe('SETUP_SECRET_REQUIRED');
    });

    it('GET: returns 403 when X-Setup-Secret header is wrong', async () => {
      const res = await setupTotpGetHandler(makeGetReq({ 'x-setup-secret': 'wrong-value' }), fakeCtx);
      expect(res.status).toBe(403);
      expect((res.jsonBody as { code: string }).code).toBe('SETUP_SECRET_REQUIRED');
    });

    it('POST: returns 403 when X-Setup-Secret header is missing', async () => {
      const res = await setupTotpPostHandler(makePostReq(), fakeCtx);
      expect(res.status).toBe(403);
      expect((res.jsonBody as { code: string }).code).toBe('SETUP_SECRET_REQUIRED');
    });

    it('POST: returns 403 when X-Setup-Secret header is wrong', async () => {
      const res = await setupTotpPostHandler(makePostReq({ 'x-setup-secret': 'bad' }), fakeCtx);
      expect(res.status).toBe(403);
      expect((res.jsonBody as { code: string }).code).toBe('SETUP_SECRET_REQUIRED');
    });

    it('GET: passes through to setup logic when X-Setup-Secret is correct', async () => {
      // Correct secret — should proceed to setup logic (returns 401 because no setup token)
      const res = await setupTotpGetHandler(makeGetReq({ 'x-setup-secret': 'supersecret-owner-only' }), fakeCtx);
      // Not a 403 — the guard passed, setup logic ran
      expect(res.status).not.toBe(403);
      // Setup logic returns 401 because no Authorization/setup token
      expect(res.status).toBe(401);
    });

    it('POST: passes through to setup logic when X-Setup-Secret is correct', async () => {
      const res = await setupTotpPostHandler(makePostReq({ 'x-setup-secret': 'supersecret-owner-only' }), fakeCtx);
      expect(res.status).not.toBe(403);
      expect(res.status).toBe(401);
    });
  });

  describe('when ADMIN_SETUP_SECRET is not set (backward compat)', () => {
    beforeEach(() => {
      delete process.env.ADMIN_SETUP_SECRET;
    });

    it('GET: allows setup without X-Setup-Secret header', async () => {
      // No secret guard → proceeds to setup logic (returns 401 for missing setup token)
      const res = await setupTotpGetHandler(makeGetReq(), fakeCtx);
      expect(res.status).not.toBe(403);
    });

    it('POST: allows setup without X-Setup-Secret header', async () => {
      const res = await setupTotpPostHandler(makePostReq(), fakeCtx);
      expect(res.status).not.toBe(403);
    });
  });
});

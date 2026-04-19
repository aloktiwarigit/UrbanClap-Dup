import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';
process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/services/adminUser.service.js', () => ({
  getAdminUserById: vi.fn(),
}));
vi.mock('../../src/services/adminSession.service.js', () => ({
  createAdminSession: vi.fn(),
}));
vi.mock('../../src/middleware/auditLog.js', () => ({
  writeAuditEntry: vi.fn(),
}));

import { adminLoginHandler } from '../../src/functions/admin/auth/login.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { getAdminUserById } from '../../src/services/adminUser.service.js';
import { createAdminSession } from '../../src/services/adminSession.service.js';
import { encryptSecret, generateSecret } from '../../src/services/totp.service.js';
import { HttpRequest } from '@azure/functions';

const fakeCtx = {} as any;
const VALID_SESSION = { sessionId: 'sess-abc', adminId: 'u1', role: 'super-admin' as const };

function makeLoginReq(body: unknown): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/auth/login',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /v1/admin/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing idToken', async () => {
    const res = await adminLoginHandler(makeLoginReq({}), fakeCtx);
    expect(res.status).toBe(400);
  });

  it('returns 401 when Firebase rejects the ID token', async () => {
    vi.mocked(verifyFirebaseIdToken).mockRejectedValue(new Error('invalid'));
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'bad' }), fakeCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('FIREBASE_TOKEN_INVALID');
  });

  it('returns 401 when admin user is not in Cosmos', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'u1' } as any);
    vi.mocked(getAdminUserById).mockResolvedValue(null);
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'tok' }), fakeCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('ADMIN_NOT_FOUND');
  });

  it('returns 200 with requiresSetup=true when TOTP not enrolled', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'u1' } as any);
    vi.mocked(getAdminUserById).mockResolvedValue({
      adminId: 'u1', email: 'a@b.com', role: 'super-admin',
      totpEnrolled: false, totpSecret: null, totpSecretPending: null,
      deactivatedAt: null,
    } as any);
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'tok' }), fakeCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).requiresSetup).toBe(true);
    expect((res.jsonBody as any).setupToken).toBeDefined();
  });

  it('returns 422 when TOTP code is missing for enrolled user', async () => {
    const secret = generateSecret();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'u1' } as any);
    vi.mocked(getAdminUserById).mockResolvedValue({
      adminId: 'u1', email: 'a@b.com', role: 'super-admin',
      totpEnrolled: true, totpSecret: encryptSecret(secret), totpSecretPending: null,
      deactivatedAt: null,
    } as any);
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'tok' }), fakeCtx);
    expect(res.status).toBe(422);
    expect((res.jsonBody as any).code).toBe('TOTP_REQUIRED');
  });

  it('returns 422 for wrong TOTP code', async () => {
    const secret = generateSecret();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'u1' } as any);
    vi.mocked(getAdminUserById).mockResolvedValue({
      adminId: 'u1', email: 'a@b.com', role: 'super-admin',
      totpEnrolled: true, totpSecret: encryptSecret(secret), totpSecretPending: null,
      deactivatedAt: null,
    } as any);
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'tok', totpCode: '000000' }), fakeCtx);
    expect(res.status).toBe(422);
    expect((res.jsonBody as any).code).toBe('TOTP_INVALID');
  });

  it('returns 200 with cookies on successful login', async () => {
    const { generateSync } = await import('otplib');
    const secret = generateSecret();
    const totpCode = generateSync({ secret, strategy: 'totp' });
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'u1' } as any);
    vi.mocked(getAdminUserById).mockResolvedValue({
      adminId: 'u1', email: 'a@b.com', role: 'super-admin',
      totpEnrolled: true, totpSecret: encryptSecret(secret), totpSecretPending: null,
      deactivatedAt: null,
    } as any);
    vi.mocked(createAdminSession).mockResolvedValue(VALID_SESSION as any);
    const res = await adminLoginHandler(makeLoginReq({ idToken: 'tok', totpCode }), fakeCtx);
    expect(res.status).toBe(200);
    const cookies = (res as any).cookies as Array<{ name: string }>;
    expect(cookies?.some((c) => c.name === 'hs_access')).toBe(true);
    expect(cookies?.some((c) => c.name === 'hs_refresh')).toBe(true);
  });
});

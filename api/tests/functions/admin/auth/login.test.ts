import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({ verifyFirebaseIdToken: vi.fn() }));
vi.mock('../../../../src/services/adminUser.service.js', () => ({
  claimAdminInvite: vi.fn(),
  getAdminUserByEmail: vi.fn(),
  getAdminUserById: vi.fn(),
  isAdminInvite: vi.fn((user: { adminId: string }) => user.adminId.startsWith('invite:')),
}));
vi.mock('../../../../src/services/totp.service.js', () => ({
  decryptSecret: vi.fn().mockReturnValue('decrypted_secret'),
  verifyToken: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  createAdminSession: vi.fn().mockResolvedValue({
    sessionId: 'sess-1',
    rawRefreshToken: 'raw-refresh-token-1',
    id: 'sess-1',
    adminId: 'admin-1',
    role: 'super-admin',
    lastActivityAt: new Date().toISOString(),
    hardExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    refreshTokenHash: 'hash-placeholder',
  }),
}));
vi.mock('../../../../src/services/jwt.service.js', () => ({
  signAccessToken: vi.fn().mockResolvedValue('access-token'),
  signMfaChallengeToken: vi.fn().mockResolvedValue('mfa-challenge-token'),
  signSetupToken: vi.fn().mockResolvedValue('setup-token'),
  verifyMfaChallengeToken: vi.fn(),
}));
vi.mock('../../../../src/services/auditLog.service.js', () => ({ auditLog: vi.fn() }));

import { adminLoginHandler } from '../../../../src/functions/admin/auth/login.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { verifyFirebaseIdToken } from '../../../../src/services/firebaseAdmin.js';
import {
  claimAdminInvite,
  getAdminUserByEmail,
  getAdminUserById,
} from '../../../../src/services/adminUser.service.js';
import { verifyToken } from '../../../../src/services/totp.service.js';
import { createAdminSession } from '../../../../src/services/adminSession.service.js';
import { signAccessToken, signMfaChallengeToken, signSetupToken } from '../../../../src/services/jwt.service.js';

const mockCtx = {} as InvocationContext;

function loginReq(body: unknown) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/auth/login',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

const validAdmin = {
  adminId: 'admin-1', role: 'super-admin' as const,
  email: 'admin@test.com', totpEnrolled: true,
  totpSecret: 'encrypted_secret', deactivatedAt: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined);
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'admin-1' } as never);
  vi.mocked(getAdminUserById).mockResolvedValue(validAdmin as never);
  vi.mocked(getAdminUserByEmail).mockResolvedValue(null);
  vi.mocked(verifyToken).mockReturnValue(true);
});

describe('POST /v1/admin/auth/login', () => {
  it('emits ADMIN_LOGIN_FAILED audit entry on invalid TOTP code', async () => {
    vi.mocked(verifyToken).mockReturnValue(false);

    const res = await adminLoginHandler(
      loginReq({ idToken: 'id-tok', totpCode: '000000' }),
      mockCtx,
    ) as HttpResponseInit;

    expect(res.status).toBe(422);
    expect((res.jsonBody as { code: string }).code).toBe('TOTP_INVALID');
    expect(vi.mocked(appendAuditEntry)).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMIN_LOGIN_FAILED', resourceId: 'admin-1' }),
    );
  });

  it('does NOT emit ADMIN_LOGIN_FAILED on successful login', async () => {
    const res = await adminLoginHandler(
      loginReq({ idToken: 'id-tok', totpCode: '123456' }),
      mockCtx,
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    // appendAuditEntry is only called by the success auditLog wrapper, not our FAILED entry
    const failedCall = vi.mocked(appendAuditEntry).mock.calls.find(
      ([doc]) => (doc as { action: string }).action === 'ADMIN_LOGIN_FAILED',
    );
    expect(failedCall).toBeUndefined();
  });

  it('returns an MFA challenge after identity verification when authenticator code is missing', async () => {
    const res = await adminLoginHandler(
      loginReq({ idToken: 'id-tok' }),
      mockCtx,
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { mfaRequired?: boolean }).mfaRequired).toBe(true);
    expect((res.jsonBody as { challengeToken?: string }).challengeToken).toBe('mfa-challenge-token');
    expect(signMfaChallengeToken).toHaveBeenCalledWith({
      sub: 'admin-1',
      email: 'admin@test.com',
    });
    expect(createAdminSession).not.toHaveBeenCalled();
  });

  it('claims a verified email invite and starts TOTP setup', async () => {
    const invite = {
      adminId: 'invite:anshutiwari183@gmail.com',
      id: 'invite:anshutiwari183@gmail.com',
      email: 'anshutiwari183@gmail.com',
      role: 'super-admin' as const,
      totpEnrolled: false,
      totpSecret: null,
      totpSecretPending: null,
      deactivatedAt: null,
    };
    const claimed = { ...invite, id: 'firebase-uid', adminId: 'firebase-uid' };
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({
      uid: 'firebase-uid',
      email: 'anshutiwari183@gmail.com',
      email_verified: true,
    } as never);
    vi.mocked(getAdminUserById).mockResolvedValue(null);
    vi.mocked(getAdminUserByEmail).mockResolvedValue(invite as never);
    vi.mocked(claimAdminInvite).mockResolvedValue(claimed as never);

    const res = await adminLoginHandler(loginReq({ idToken: 'id-tok' }), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { requiresSetup?: boolean }).requiresSetup).toBe(true);
    expect(signSetupToken).toHaveBeenCalledWith({
      sub: 'firebase-uid',
      email: 'anshutiwari183@gmail.com',
    });
    expect(res.cookies).toContainEqual(
      expect.objectContaining({
        name: 'hs_setup',
        value: 'setup-token',
        httpOnly: true,
        path: '/',
      }),
    );
    expect(claimAdminInvite).toHaveBeenCalledWith(invite, 'firebase-uid', 'anshutiwari183@gmail.com');
  });

  it('normalizes legacy admin role to super-admin on successful login', async () => {
    vi.mocked(getAdminUserById).mockResolvedValue({ ...validAdmin, role: 'admin' } as never);

    const res = await adminLoginHandler(
      loginReq({ idToken: 'id-tok', totpCode: '123456' }),
      mockCtx,
    ) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(createAdminSession).toHaveBeenCalledWith({ adminId: 'admin-1', role: 'super-admin' });
    expect(signAccessToken).toHaveBeenCalledWith({
      sub: 'admin-1',
      role: 'super-admin',
      sessionId: 'sess-1',
    });
    expect((res.jsonBody as { role: string }).role).toBe('super-admin');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({ verifyFirebaseIdToken: vi.fn() }));
vi.mock('../../../../src/services/adminUser.service.js', () => ({ getAdminUserById: vi.fn() }));
vi.mock('../../../../src/services/totp.service.js', () => ({
  decryptSecret: vi.fn().mockReturnValue('decrypted_secret'),
  verifyToken: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  createAdminSession: vi.fn().mockResolvedValue({ sessionId: 'sess-1' }),
}));
vi.mock('../../../../src/services/jwt.service.js', () => ({
  signAccessToken: vi.fn().mockResolvedValue('access-token'),
  signSetupToken: vi.fn().mockResolvedValue('setup-token'),
}));
vi.mock('../../../../src/services/auditLog.service.js', () => ({ auditLog: vi.fn() }));

import { adminLoginHandler } from '../../../../src/functions/admin/auth/login.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import { verifyFirebaseIdToken } from '../../../../src/services/firebaseAdmin.js';
import { getAdminUserById } from '../../../../src/services/adminUser.service.js';
import { verifyToken } from '../../../../src/services/totp.service.js';

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
});

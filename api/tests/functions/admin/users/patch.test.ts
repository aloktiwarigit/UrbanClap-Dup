import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../../../src/services/adminUser.service.js', () => ({
  getAdminUserById: vi.fn(),
  updateAdminUser: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  deleteAllSessionsForAdmin: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

import { adminPatchUserHandler } from '../../../../src/functions/admin/users/patch.js';
import { updateAdminUser } from '../../../../src/services/adminUser.service.js';
import { deleteAllSessionsForAdmin } from '../../../../src/services/adminSession.service.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import type { AdminContext } from '../../../../src/types/admin.js';

const fakeCtx = {} as InvocationContext;

function makeReq(adminId: string, body: unknown): HttpRequest {
  return new HttpRequest({
    url: `http://localhost/api/v1/admin/users/${adminId}`,
    method: 'PATCH',
    params: { adminId },
    headers: { 'content-type': 'application/json' },
    body: { string: JSON.stringify(body) },
  });
}

const superAdmin: AdminContext = { adminId: 'super-1', role: 'super-admin', sessionId: 'sess-1' };
const opsManager: AdminContext = { adminId: 'ops-1', role: 'ops-manager', sessionId: 'sess-2' };

describe('adminPatchUserHandler — role ceiling guard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Role ceiling ───────────────────────────────────────────────────────

  it('returns 403 when ops-manager tries to set their own role (role ceiling)', async () => {
    // Targeting self (ops-1 → ops-1) — still blocked by role ceiling
    const res = await adminPatchUserHandler(makeReq('ops-1', { role: 'super-admin' }), fakeCtx, opsManager);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INSUFFICIENT_ROLE_FOR_ROLE_CHANGE');
    expect(updateAdminUser).not.toHaveBeenCalled();
  });

  it('returns 200 when ops-manager updates their own displayName (non-role, non-deactivatedAt)', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    // Self-patch — no cross-user block; non-role field — no role ceiling
    const res = await adminPatchUserHandler(makeReq('ops-1', { displayName: 'Alice' }), fakeCtx, opsManager);
    expect(res.status).toBe(200);
    expect(updateAdminUser).toHaveBeenCalledWith('ops-1', { displayName: 'Alice' });
    expect(auditLog).toHaveBeenCalledWith(
      opsManager, 'ADMIN_USER_CHANGE', 'admin_user', 'ops-1',
      expect.objectContaining({ targetAdminId: 'ops-1', changed: ['displayName'] }),
    );
  });

  it('returns 200 when super-admin sets any role on another user', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('target-user', { role: 'finance' }), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
    expect(updateAdminUser).toHaveBeenCalledWith('target-user', { role: 'finance' });
  });

  it('returns 200 when super-admin demotes another super-admin to ops-manager', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('other-super', { role: 'ops-manager' }), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
    expect(updateAdminUser).toHaveBeenCalledWith('other-super', { role: 'ops-manager' });
  });

  // ── deactivatedAt ceiling ─────────────────────────────────────────────

  it('returns 403 when ops-manager tries to deactivate their own account', async () => {
    const res = await adminPatchUserHandler(makeReq('ops-1', { deactivatedAt: '2024-01-01T00:00:00Z' }), fakeCtx, opsManager);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INSUFFICIENT_ROLE_FOR_DEACTIVATION');
    expect(updateAdminUser).not.toHaveBeenCalled();
  });

  it('returns 200 when super-admin deactivates another user', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('target-user', { deactivatedAt: '2024-01-01T00:00:00Z' }), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
    expect(updateAdminUser).toHaveBeenCalledWith('target-user', expect.objectContaining({ deactivatedAt: '2024-01-01T00:00:00Z' }));
  });

  it('returns 200 when super-admin reactivates a user (deactivatedAt: null)', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('target-user', { deactivatedAt: null }), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
  });

  // ── IDOR / cross-user write protection ───────────────────────────────

  it('returns 403 when ops-manager targets another user (cross-user write blocked)', async () => {
    // ops-1 targeting 'target-user' (not self) → forbidden unless super-admin
    const res = await adminPatchUserHandler(makeReq('target-user', { displayName: 'Hacked' }), fakeCtx, opsManager);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INSUFFICIENT_ROLE_FOR_CROSS_USER_PATCH');
    expect(updateAdminUser).not.toHaveBeenCalled();
  });

  it('returns 403 when finance role targets another user (cross-user write blocked)', async () => {
    const financeAdmin: AdminContext = { adminId: 'fin-1', role: 'finance', sessionId: 'sess-3' };
    const res = await adminPatchUserHandler(makeReq('super-1', { displayName: 'Evil' }), fakeCtx, financeAdmin);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INSUFFICIENT_ROLE_FOR_CROSS_USER_PATCH');
  });

  it('returns 200 when super-admin patches any user', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('any-user', { displayName: 'Bob' }), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
  });

  // ── Schema validation ─────────────────────────────────────────────────

  it('returns 400 for invalid JSON body', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/users/super-1',
      method: 'PATCH',
      params: { adminId: 'super-1' },
      headers: { 'content-type': 'application/json' },
      body: { string: 'not-json{{{' },
    });
    const res = await adminPatchUserHandler(req, fakeCtx, superAdmin);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_JSON');
  });

  it('returns 400 for unknown fields (strict schema)', async () => {
    const res = await adminPatchUserHandler(makeReq('super-1', { unknownField: 'hack' }), fakeCtx, superAdmin);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when adminId is empty string (missing route param)', async () => {
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/admin/users/',
      method: 'PATCH',
      params: { adminId: '' },
      headers: { 'content-type': 'application/json' },
      body: { string: JSON.stringify({ displayName: 'x' }) },
    });
    const res = await adminPatchUserHandler(req, fakeCtx, superAdmin);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('MISSING_ADMIN_ID');
  });

  it('returns 200 for empty body {} (no-op patch, audit still fires)', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    const res = await adminPatchUserHandler(makeReq('super-1', {}), fakeCtx, superAdmin);
    expect(res.status).toBe(200);
    // updateAdminUser called with empty patch — Cosmos does a no-op replace
    expect(updateAdminUser).toHaveBeenCalledWith('super-1', {});
  });

  // ── Session revocation on privilege changes ───────────────────────────

  it('revokes all sessions for target when role changes', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    await adminPatchUserHandler(makeReq('target-user', { role: 'finance' }), fakeCtx, superAdmin);
    expect(deleteAllSessionsForAdmin).toHaveBeenCalledWith('target-user');
  });

  it('revokes all sessions for target when deactivatedAt is set', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    await adminPatchUserHandler(makeReq('target-user', { deactivatedAt: '2024-01-01T00:00:00Z' }), fakeCtx, superAdmin);
    expect(deleteAllSessionsForAdmin).toHaveBeenCalledWith('target-user');
  });

  it('does NOT revoke sessions for displayName-only patch', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(undefined);
    await adminPatchUserHandler(makeReq('target-user', { displayName: 'Bob' }), fakeCtx, superAdmin);
    expect(deleteAllSessionsForAdmin).not.toHaveBeenCalled();
  });

  // ── Not-found handling ────────────────────────────────────────────────

  it('returns 404 when updateAdminUser throws not-found error', async () => {
    vi.mocked(updateAdminUser).mockRejectedValue(new Error('AdminUser target-user not found'));
    const res = await adminPatchUserHandler(makeReq('target-user', { displayName: 'Ghost' }), fakeCtx, superAdmin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('ADMIN_USER_NOT_FOUND');
  });
});

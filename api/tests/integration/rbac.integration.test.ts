import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
  deleteSession: vi.fn(),
}));
vi.mock('../../src/services/adminUser.service.js', () => ({
  getAdminUserById: vi.fn(),
}));
vi.mock('../../src/middleware/auditLog.js', () => ({
  writeAuditEntry: vi.fn(),
}));

import { requireAdmin } from '../../src/middleware/requireAdmin.js';
import { signAccessToken } from '../../src/services/jwt.service.js';
import { touchAndGetSession } from '../../src/services/adminSession.service.js';
import type { AdminRole } from '../../src/types/admin.js';
import { HttpRequest } from '@azure/functions';

const fakeCtx = {} as any;
const fakeHandler = vi.fn().mockResolvedValue({ status: 200, jsonBody: {} });

async function callWithRole(role: AdminRole, allowedRoles: AdminRole[]) {
  vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1', adminId: 'u1', role } as any);
  const token = await signAccessToken({ sub: 'u1', role, sessionId: 's1' });
  const req = new HttpRequest({
    url: 'http://localhost/api/v1/admin/test',
    method: 'GET',
    headers: { cookie: `hs_access=${token}` },
  });
  const wrapped = requireAdmin(allowedRoles)(fakeHandler);
  return wrapped(req, fakeCtx);
}

describe('RBAC role matrix', () => {
  beforeEach(() => vi.clearAllMocks());

  it('super-admin can access super-admin-only endpoint', async () => {
    const res = await callWithRole('super-admin', ['super-admin']);
    expect(res.status).toBe(200);
  });

  it('ops-manager is forbidden on super-admin-only endpoint', async () => {
    const res = await callWithRole('ops-manager', ['super-admin']);
    expect(res.status).toBe(403);
  });

  it('ops-manager can access ops+super endpoint', async () => {
    const res = await callWithRole('ops-manager', ['super-admin', 'ops-manager']);
    expect(res.status).toBe(200);
  });

  it('finance is forbidden on ops endpoint', async () => {
    const res = await callWithRole('finance', ['super-admin', 'ops-manager']);
    expect(res.status).toBe(403);
  });

  it('finance can access finance+super endpoint', async () => {
    const res = await callWithRole('finance', ['super-admin', 'finance']);
    expect(res.status).toBe(200);
  });

  it('support-agent is forbidden on finance endpoint', async () => {
    const res = await callWithRole('support-agent', ['super-admin', 'finance']);
    expect(res.status).toBe(403);
  });

  it('support-agent can access all-roles endpoint', async () => {
    const res = await callWithRole('support-agent', [
      'super-admin', 'ops-manager', 'finance', 'support-agent',
    ]);
    expect(res.status).toBe(200);
  });

  it('403 response includes requiredRoles', async () => {
    const res = await callWithRole('finance', ['super-admin']);
    expect((res.jsonBody as any).requiredRoles).toEqual(['super-admin']);
  });
});

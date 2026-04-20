import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
}));

vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  queryAuditLog: vi.fn(),
}));

import { adminAuditLogListHandler } from '../../../../src/functions/admin/audit-log/list.js';
import { signAccessToken } from '../../../../src/services/jwt.service.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { queryAuditLog } from '../../../../src/cosmos/audit-log-repository.js';
import { HttpRequest } from '@azure/functions';

const fakeCtx = {} as any;

function makeReq(cookieHeader?: string, searchParams?: Record<string, string>): HttpRequest {
  const url = new URL('http://localhost/api/v1/admin/audit-log');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new HttpRequest({
    url: url.toString(),
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

const sampleEntry = {
  id: '00000000-0000-0000-0000-000000000001',
  adminId: 'admin-1',
  role: 'super-admin' as const,
  action: 'admin.login',
  resourceType: 'admin_session',
  resourceId: 'sess-abc',
  payload: {},
  timestamp: '2026-04-20T10:00:00.000Z',
};

describe('GET /v1/admin/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queryAuditLog).mockResolvedValue({ entries: [sampleEntry] });
  });

  it('returns 401 when no cookie present', async () => {
    const res = await adminAuditLogListHandler(makeReq(), fakeCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 403 when role is ops-manager (not super-admin)', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'ops-manager', sessionId: 's1' });
    const res = await adminAuditLogListHandler(makeReq(`hs_access=${token}`), fakeCtx);
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('returns 200 with entries for super-admin', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await adminAuditLogListHandler(makeReq(`hs_access=${token}`), fakeCtx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { entries: unknown[] };
    expect(body.entries).toHaveLength(1);
  });

  it('returns 400 when pageSize is invalid', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await adminAuditLogListHandler(
      makeReq(`hs_access=${token}`, { pageSize: '999' }),
      fakeCtx,
    );
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('VALIDATION_ERROR');
  });

  it('passes filter params to queryAuditLog', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    await adminAuditLogListHandler(
      makeReq(`hs_access=${token}`, {
        adminId: 'admin-1',
        action: 'admin.login',
        resourceType: 'admin_session',
      }),
      fakeCtx,
    );
    expect(queryAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'admin.login',
        resourceType: 'admin_session',
      }),
    );
  });

  it('forwards continuationToken in response when present', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    vi.mocked(queryAuditLog).mockResolvedValue({
      entries: [sampleEntry],
      continuationToken: 'next-tok',
    });
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await adminAuditLogListHandler(makeReq(`hs_access=${token}`), fakeCtx);
    expect((res.jsonBody as any).continuationToken).toBe('next-tok');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn(),
}));

import { requireAdmin } from '../../src/middleware/requireAdmin.js';
import { signAccessToken } from '../../src/services/jwt.service.js';
import { touchAndGetSession } from '../../src/services/adminSession.service.js';
import { HttpRequest } from '@azure/functions';
import type { HttpResponseInit } from '@azure/functions';

function makeReq(cookieHeader?: string): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/test',
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

const fakeCtx = {} as any;

describe('requireAdmin', () => {
  const handler = vi.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no hs_access cookie', async () => {
    const wrapped = requireAdmin(['super-admin'])(handler);
    const res = await wrapped(makeReq(), fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for an invalid JWT', async () => {
    const wrapped = requireAdmin(['super-admin'])(handler);
    const res = await wrapped(makeReq('hs_access=not.a.valid.jwt'), fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('TOKEN_INVALID');
  });

  it('returns 401 when session is expired or not found', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue(null);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const wrapped = requireAdmin(['super-admin'])(handler);
    const res = await wrapped(makeReq(`hs_access=${token}`), fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('SESSION_EXPIRED');
  });

  it('returns 403 when role is not permitted', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'finance', sessionId: 's1' });
    const wrapped = requireAdmin(['super-admin', 'ops-manager'])(handler);
    const res = await wrapped(makeReq(`hs_access=${token}`), fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('calls handler with AdminContext when role is permitted', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const wrapped = requireAdmin(['super-admin'])(handler);
    await wrapped(makeReq(`hs_access=${token}`), fakeCtx);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      fakeCtx,
      expect.objectContaining({ adminId: 'u1', role: 'super-admin', sessionId: 's1' }),
    );
  });
});

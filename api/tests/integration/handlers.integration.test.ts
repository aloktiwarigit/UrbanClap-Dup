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

import { adminRefreshHandler } from '../../src/functions/admin/auth/refresh.js';
import { adminLogoutHandler } from '../../src/functions/admin/auth/logout.js';
import { adminMeHandler } from '../../src/functions/admin/me.js';
import { touchAndGetSession, deleteSession } from '../../src/services/adminSession.service.js';
import { getAdminUserById } from '../../src/services/adminUser.service.js';
import { writeAuditEntry } from '../../src/middleware/auditLog.js';
import { signAccessToken } from '../../src/services/jwt.service.js';
import { requireAdmin } from '../../src/middleware/requireAdmin.js';
import { HttpRequest } from '@azure/functions';

const fakeCtx = {} as any;

function makeReqWithCookies(cookies: Record<string, string>): HttpRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/test',
    method: 'POST',
    headers: { cookie: cookieHeader },
  });
}

// Wrap adminMeHandler through the requireAdmin HOF (same as production wiring)
const wrappedMe = requireAdmin(['super-admin', 'ops-manager', 'finance', 'support-agent'])(adminMeHandler);

describe('POST /v1/admin/auth/refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when hs_refresh cookie is missing', async () => {
    const req = new HttpRequest({ url: 'http://localhost/', method: 'POST' });
    const res = await adminRefreshHandler(req, fakeCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('REFRESH_TOKEN_MISSING');
  });

  it('returns 401 when session has expired', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue(null);
    const res = await adminRefreshHandler(
      makeReqWithCookies({ hs_refresh: 'some-session-id' }),
      fakeCtx,
    );
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('SESSION_EXPIRED');
  });

  it('returns 200 with new hs_access cookie when session is valid', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({
      sessionId: 's1', adminId: 'u1', role: 'super-admin',
      lastActivityAt: new Date().toISOString(),
      hardExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    const res = await adminRefreshHandler(
      makeReqWithCookies({ hs_refresh: 's1' }),
      fakeCtx,
    );
    expect(res.status).toBe(200);
    const cookies = (res as any).cookies as Array<{ name: string }>;
    expect(cookies?.some((c) => c.name === 'hs_access')).toBe(true);
  });
});

describe('POST /v1/admin/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 and clears cookies even without a token', async () => {
    const req = new HttpRequest({ url: 'http://localhost/', method: 'POST' });
    const res = await adminLogoutHandler(req, fakeCtx);
    expect(res.status).toBe(200);
    const cookies = (res as any).cookies as Array<{ name: string; maxAge: number }>;
    expect(cookies?.some((c) => c.name === 'hs_access' && c.maxAge === 0)).toBe(true);
    expect(cookies?.some((c) => c.name === 'hs_refresh' && c.maxAge === 0)).toBe(true);
  });

  it('calls deleteSession and writes audit log when valid token present', async () => {
    vi.mocked(deleteSession).mockResolvedValue(undefined);
    vi.mocked(writeAuditEntry).mockResolvedValue(undefined);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await adminLogoutHandler(
      makeReqWithCookies({ hs_access: token }),
      fakeCtx,
    );
    expect(res.status).toBe(200);
    expect(deleteSession).toHaveBeenCalledWith('s1');
    expect(writeAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGOUT', adminId: 'u1' }),
    );
  });
});

describe('GET /v1/admin/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when hs_access cookie is missing', async () => {
    const req = new HttpRequest({ url: 'http://localhost/', method: 'GET' });
    const res = await wrappedMe(req, fakeCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('UNAUTHENTICATED');
  });

  it('returns 404 when admin user is not found', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({
      sessionId: 's1', adminId: 'u1', role: 'super-admin',
    } as any);
    vi.mocked(getAdminUserById).mockResolvedValue(null);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await wrappedMe(
      makeReqWithCookies({ hs_access: token }),
      fakeCtx,
    );
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('ADMIN_NOT_FOUND');
  });

  it('returns 200 with admin profile when authenticated', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({
      sessionId: 's1', adminId: 'u1', role: 'super-admin',
    } as any);
    vi.mocked(getAdminUserById).mockResolvedValue({
      adminId: 'u1', email: 'admin@example.com', role: 'super-admin',
    } as any);
    const token = await signAccessToken({ sub: 'u1', role: 'super-admin', sessionId: 's1' });
    const res = await wrappedMe(
      makeReqWithCookies({ hs_access: token }),
      fakeCtx,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).adminId).toBe('u1');
    expect((res.jsonBody as any).email).toBe('admin@example.com');
    expect((res.jsonBody as any).role).toBe('super-admin');
  });
});

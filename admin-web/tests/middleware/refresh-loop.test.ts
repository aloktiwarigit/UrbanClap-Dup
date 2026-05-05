// @vitest-environment node
// Regression test: adding /admin-api/:path* to the middleware matcher must NOT
// cause the middleware to intercept its own outgoing auth/refresh requests.
// The early-return guard for /admin-api/v1/admin/auth/(refresh|login|setup)
// must fire BEFORE any JWT verification and return NextResponse.next() directly.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

const JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

function makeRequest(pathname: string, cookie?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  if (!cookie) return new NextRequest(url);
  return new NextRequest(url, { headers: { cookie } });
}

describe('middleware refresh-loop guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('early-returns NextResponse.next() for /admin-api/v1/admin/auth/refresh without JWT verification', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    // If JWT verification ran it would call fetch; spy to detect that.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await middleware(
      makeRequest('/admin-api/v1/admin/auth/refresh'),
    );

    // Must NOT redirect to login (no location header)
    expect(response.headers.get('location')).toBeNull();
    // Must NOT be a 401 or 500
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(500);
    // Middleware must NOT have attempted a token refresh (no outgoing fetch)
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('early-returns NextResponse.next() for /admin-api/v1/admin/auth/login without JWT verification', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await middleware(
      makeRequest('/admin-api/v1/admin/auth/login'),
    );

    expect(response.headers.get('location')).toBeNull();
    expect(response.status).not.toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('early-returns NextResponse.next() for /admin-api/v1/admin/auth/setup without JWT verification', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const response = await middleware(
      makeRequest('/admin-api/v1/admin/auth/setup'),
    );

    expect(response.headers.get('location')).toBeNull();
    expect(response.status).not.toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does NOT early-return for other /admin-api paths (JWT check is performed)', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    // No valid token → fetch will be called for refresh (or redirect to login)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    const response = await middleware(
      makeRequest('/admin-api/v1/admin/orders'),
    );

    // Without a valid token the middleware should redirect to login
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('/login');
  });
});

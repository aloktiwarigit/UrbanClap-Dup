// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import type { AdminRole } from '@/lib/auth/types';

// next-intl/middleware imports next/server without .js extension which fails in
// Vitest's node environment. Mock it to return a pass-through middleware.
vi.mock('next-intl/middleware', () => ({
  default: () => (req: NextRequest) => NextResponse.next({ request: req }),
}));

import { middleware } from '../middleware';

const JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

function makeRequest(
  pathname: string,
  cookie?: string,
  headers?: HeadersInit,
  origin = 'http://localhost:3000',
): NextRequest {
  const requestHeaders = new Headers(headers);
  if (cookie) requestHeaders.set('cookie', cookie);
  return new NextRequest(`${origin}${pathname}`, { headers: requestHeaders });
}

async function signAccessToken(role: AdminRole): Promise<string> {
  return new SignJWT({ role, sessionId: 'sess-1', type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin-1')
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(JWT_SECRET));
}

describe('admin middleware session refresh', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('allows protected routes when the access cookie is valid', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const accessToken = await signAccessToken('super-admin');
    const response = await middleware(makeRequest('/orders', `hs_access=${accessToken}`));

    expect(response.headers.get('location')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes access from hs_refresh before rendering a protected route', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    const accessToken = await signAccessToken('super-admin');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'set-cookie': `hs_access=${accessToken}; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=Strict`,
          },
        }),
      ),
    );

    const response = await middleware(makeRequest('/orders', 'hs_refresh=sess-1'));
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const requestHeaders = new Headers(init?.headers);
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(
      'https://functions.example.test/api/v1/admin/auth/refresh',
    );
    expect(requestHeaders.get('cookie')).toBe('hs_refresh=sess-1');
    expect(response.headers.get('location')).toBeNull();
    expect(setCookie).toContain(`hs_access=${accessToken}`);
    expect(setCookie).not.toContain('Secure');
    expect(response.headers.get('x-middleware-override-headers')).toContain('cookie');
    expect(response.headers.get('x-middleware-request-cookie')).toContain(`hs_access=${accessToken}`);
  });

  it('redirects to login and clears cookies when refresh fails', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 'SESSION_EXPIRED' }), { status: 401 }),
      ),
    );

    const response = await middleware(makeRequest('/orders', 'hs_refresh=sess-1'));
    const location = response.headers.get('location') ?? '';
    const setCookie = response.headers.get('set-cookie') ?? '';

    // After locale migration: redirect is to /{defaultLocale}/login
    expect(location).toMatch(/\/hi\/login\?next=%2Forders/);
    expect(setCookie).toContain('hs_access=');
    expect(setCookie).toContain('hs_refresh=');
    expect(setCookie).toContain('Path=/admin-api/v1/admin/auth/refresh');
  });

  it('keeps SWA backend port out of unauthenticated redirects', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);

    const response = await middleware(
      makeRequest(
        '/orders',
        undefined,
        {
          'x-forwarded-host': 'black-river-0af326a00.7.azurestaticapps.net',
          'x-forwarded-proto': 'https',
        },
        'https://black-river-0af326a00.7.azurestaticapps.net:8080',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://black-river-0af326a00.7.azurestaticapps.net/hi/login?next=%2Forders',
    );
  });

  it('redirects locale roots directly to login without the SWA backend port', async () => {
    const response = await middleware(
      makeRequest(
        '/',
        undefined,
        {
          'x-forwarded-host': 'black-river-0af326a00.7.azurestaticapps.net',
          'x-forwarded-proto': 'https',
        },
        'https://black-river-0af326a00.7.azurestaticapps.net:8080',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://black-river-0af326a00.7.azurestaticapps.net/hi/login',
    );
  });

  it('redirects unprefixed public routes to their locale-prefixed URL without the SWA backend port', async () => {
    const response = await middleware(
      makeRequest(
        '/login',
        undefined,
        {
          'x-forwarded-host': 'black-river-0af326a00.7.azurestaticapps.net',
          'x-forwarded-proto': 'https',
        },
        'https://black-river-0af326a00.7.azurestaticapps.net:8080',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://black-river-0af326a00.7.azurestaticapps.net/hi/login',
    );
  });

  it('keeps RBAC redirects after a successful refresh', async () => {
    vi.stubEnv('JWT_SECRET', JWT_SECRET);
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    const accessToken = await signAccessToken('finance');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'set-cookie': `hs_access=${accessToken}; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=Strict`,
          },
        }),
      ),
    );

    const response = await middleware(makeRequest('/orders', 'hs_refresh=sess-1'));
    const location = response.headers.get('location') ?? '';

    // After locale migration: not-authorized is now /{locale}/not-authorized
    expect(location).toMatch(/\/hi\/not-authorized\?from=%2Forders&next=%2Fhi%2Ffinance/);
    expect(response.headers.get('set-cookie')).toContain(`hs_access=${accessToken}`);
  });
});

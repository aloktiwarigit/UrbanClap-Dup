import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/admin-api/[...path]/route';

// Helper: build a POST request that passes the Origin allowlist CSRF guard
// (i.e., either no Origin header, or an Origin matching NEXT_PUBLIC_APP_URL).
function makePostRequest(url: string, extraHeaders: Record<string, string> = {}, body = '{}'): Request {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: 'hs_access=access-token',
      ...extraHeaders,
    },
    body,
  });
}

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('admin API proxy route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('forwards requests to the configured Functions API base URL', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api/');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const request = makePostRequest(
      'https://admin.example.test/admin-api/v1/admin/auth/login?debug=1',
      { cookie: 'hs_access=access-token' },
      JSON.stringify({ idToken: 'firebase-token' }),
    );

    const response = await POST(request, context(['v1', 'admin', 'auth', 'login']));
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const headers = init?.headers as Headers;

    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe(
      'https://functions.example.test/api/v1/admin/auth/login?debug=1',
    );
    expect(init).toEqual(expect.objectContaining({ method: 'POST', cache: 'no-store' }));
    expect(headers.get('cookie')).toContain('hs_access=access-token');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('rewrites refresh cookie path to the admin app root', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 200,
          headers: {
            'set-cookie':
              'hs_refresh=sess-1; Max-Age=28800; Path=/api/v1/admin/auth/refresh; HttpOnly; Secure; SameSite=Strict',
          },
        }),
      ),
    );

    const request = makePostRequest('http://localhost:3000/admin-api/v1/admin/auth/login');

    const response = await POST(request, context(['v1', 'admin', 'auth', 'login']));
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(setCookie).toContain('Path=/');
    expect(setCookie).not.toContain('Secure');
  });

  it('rewrites setup cookie path so the exchange route can read it', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ requiresSetup: true }), {
          status: 200,
          headers: {
            'set-cookie':
              'hs_setup=setup-token; Max-Age=600; Path=/setup; HttpOnly; Secure; SameSite=Strict',
          },
        }),
      ),
    );

    const request = makePostRequest('http://localhost:3000/admin-api/v1/admin/auth/login');

    const response = await POST(request, context(['v1', 'admin', 'auth', 'login']));
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(setCookie).toContain('hs_setup=setup-token');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).not.toContain('Path=/setup');
    expect(setCookie).not.toContain('Secure');
  });

  it('clears the setup cookie after successful TOTP setup', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ adminId: 'admin-1' }), {
          status: 200,
          headers: {
            'set-cookie':
              'hs_access=access-token; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=Strict',
          },
        }),
      ),
    );

    const request = makePostRequest(
      'http://localhost:3000/admin-api/v1/admin/auth/setup-totp',
      {},
      JSON.stringify({ totpCode: '123456' }),
    );

    const response = await POST(request, context(['v1', 'admin', 'auth', 'setup-totp']));
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(setCookie).toContain('hs_access=access-token');
    expect(setCookie).toContain('hs_setup=; Path=/; Max-Age=0');
    expect(setCookie).not.toContain('Secure');
  });

  it('does not clear the setup cookie after a failed TOTP code', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 'TOTP_INVALID' }), {
          status: 422,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const request = makePostRequest(
      'http://localhost:3000/admin-api/v1/admin/auth/setup-totp',
      {},
      JSON.stringify({ totpCode: '000000' }),
    );

    const response = await POST(request, context(['v1', 'admin', 'auth', 'setup-totp']));
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(422);
    expect(setCookie).not.toContain('hs_setup=');
  });

  it('clears the legacy proxy-scoped refresh cookie on logout', async () => {
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 200,
          headers: {
            'set-cookie':
              'hs_refresh=; Max-Age=0; Path=/api/v1/admin/auth/refresh; HttpOnly; Secure; SameSite=Strict',
          },
        }),
      ),
    );

    const request = makePostRequest('http://localhost:3000/admin-api/v1/admin/auth/logout');

    const response = await POST(request, context(['v1', 'admin', 'auth', 'logout']));
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('Path=/admin-api/v1/admin/auth/refresh');
    expect(setCookie).not.toContain('Secure');
  });

  it('returns 403 for POST from a cross-origin Origin', async () => {
    // Origin allowlist CSRF guard: cross-origin POST must be rejected before
    // reaching the upstream API — no fetch mock needed.
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.homeservices.app');
    const request = new Request('https://admin.homeservices.app/admin-api/v1/admin/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Simulate a cross-site request by setting a foreign Origin
        origin: 'https://evil.example.com',
      },
      body: '{}',
    });

    const response = await POST(request, context(['v1', 'admin', 'orders']));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('Cross-origin') });
  });

  it('allows POST from the same origin (no CSRF block)', async () => {
    // A request from the matching Origin must pass the guard and reach upstream.
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.homeservices.app');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const request = new Request('https://admin.homeservices.app/admin-api/v1/admin/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://admin.homeservices.app',
      },
      body: '{}',
    });

    const response = await POST(request, context(['v1', 'admin', 'orders']));
    expect(response.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
  });
});

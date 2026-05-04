import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/admin-api/[...path]/route';

const CSRF_TOKEN = 'test-csrf-token-abc123';

// Helper: build a request with matching hs_csrf cookie + x-csrf-token header
// (satisfies the CSRF double-submit guard added in E12-S06).
function makePostRequest(url: string, extraHeaders: Record<string, string> = {}, body = '{}'): Request {
  return new Request(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `hs_csrf=${CSRF_TOKEN}`,
      'x-csrf-token': CSRF_TOKEN,
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
      { cookie: `hs_access=access-token; hs_csrf=${CSRF_TOKEN}` },
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

  it('returns 403 for POST without CSRF tokens', async () => {
    const request = new Request('http://localhost:3000/admin-api/v1/admin/orders', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST(request, context(['v1', 'admin', 'orders']));
    expect(response.status).toBe(403);
  });

  it('returns 403 for POST with mismatched CSRF cookie and header', async () => {
    const request = new Request('http://localhost:3000/admin-api/v1/admin/orders', {
      method: 'POST',
      headers: {
        cookie: 'hs_csrf=token-a',
        'x-csrf-token': 'token-b',
      },
      body: '{}',
    });

    const response = await POST(request, context(['v1', 'admin', 'orders']));
    expect(response.status).toBe(403);
  });
});

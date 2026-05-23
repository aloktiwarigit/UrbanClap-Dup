import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PATCH, POST, PUT, GET } from '../app/admin-api/[...path]/route';

function makeRequest(
  method: string,
  origin: string | null,
  url = 'https://admin.example.test/admin-api/v1/admin/orders',
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin !== null) headers['origin'] = origin;
  return new Request(url, {
    method,
    headers,
    body: method === 'GET' ? null : '{}',
  });
}

function context(path: string[] = ['v1', 'admin', 'orders']) {
  return { params: Promise.resolve({ path }) };
}

const mockOk = () =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );

describe('admin-api CSRF Origin guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('POST with matching Origin → allowed (proxied to upstream)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await POST(
      makeRequest('POST', 'https://admin.example.test'),
      context(),
    );
    expect(res.status).not.toBe(403);
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
  });

  it('POST with mismatched Origin → 403', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await POST(
      makeRequest('POST', 'https://evil.example.com'),
      context(),
    );
    expect(res.status).toBe(403);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('POST with missing Origin → 403 (default-deny)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await POST(makeRequest('POST', null), context());
    expect(res.status).toBe(403);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('PUT with missing Origin → 403', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await PUT(makeRequest('PUT', null), context());
    expect(res.status).toBe(403);
  });

  it('PATCH with missing Origin → 403', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await PATCH(makeRequest('PATCH', null), context());
    expect(res.status).toBe(403);
  });

  it('DELETE with missing Origin → 403', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await DELETE(makeRequest('DELETE', null), context());
    expect(res.status).toBe(403);
  });

  it('GET with no Origin → allowed (safe method, no check)', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://admin.example.test');
    vi.stubEnv('API_BASE_URL', 'https://functions.example.test/api');
    vi.stubGlobal('fetch', mockOk());

    const res = await GET(makeRequest('GET', null), context());
    expect(res.status).not.toBe(403);
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
  });
});

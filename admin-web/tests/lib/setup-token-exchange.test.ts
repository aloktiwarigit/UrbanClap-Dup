// @vitest-environment node

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Dynamic import to avoid Next.js module resolution issues in tests.
async function loadExchange() {
  const mod = await import('../../app/api/setup-token/exchange/route');
  return mod;
}

function makeRequest(cookies: Record<string, string> = {}): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  const req = new NextRequest('http://localhost:3000/api/setup-token/exchange', {
    method: 'GET',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  return req;
}

describe('GET /api/setup-token/exchange', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns { token } when hs_setup cookie is present and non-empty', async () => {
    const { GET } = await loadExchange();
    const req = makeRequest({ hs_setup: 'mock.setup.token.abc' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { token?: string };
    expect(body.token).toBe('mock.setup.token.abc');
  });

  it('returns 401 when hs_setup cookie is absent', async () => {
    const { GET } = await loadExchange();
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when hs_setup cookie is empty string', async () => {
    const { GET } = await loadExchange();
    const req = makeRequest({ hs_setup: '' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('clears the hs_setup cookie in the response (set Max-Age=0)', async () => {
    const { GET } = await loadExchange();
    const req = makeRequest({ hs_setup: 'mock.setup.token.abc' });
    const res = await GET(req);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/hs_setup=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });
});

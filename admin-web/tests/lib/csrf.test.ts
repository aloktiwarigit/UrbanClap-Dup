// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { getCsrfToken, verifyCsrf } from '@/lib/csrf';

function makeRequest(method: string, cookie?: string, csrfHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers['cookie'] = cookie;
  if (csrfHeader !== undefined) headers['x-csrf-token'] = csrfHeader;
  return new Request('http://localhost:3000/admin-api/v1/admin/orders', {
    method,
    headers,
  });
}

describe('getCsrfToken', () => {
  it('returns null when cookies is null', () => {
    expect(getCsrfToken(null)).toBeNull();
  });

  it('returns null when the hs_csrf cookie is absent', () => {
    expect(getCsrfToken('other=value; another=x')).toBeNull();
  });

  it('extracts the hs_csrf token from a cookie string', () => {
    expect(getCsrfToken('hs_csrf=abc123')).toBe('abc123');
  });

  it('extracts hs_csrf when other cookies are present', () => {
    expect(getCsrfToken('hs_access=tok; hs_csrf=mytoken; other=x')).toBe('mytoken');
  });

  it('decodes URI-encoded values', () => {
    expect(getCsrfToken('hs_csrf=hello%20world')).toBe('hello world');
  });
});

describe('verifyCsrf', () => {
  it('bypasses the check for GET requests', () => {
    const req = makeRequest('GET');
    expect(verifyCsrf(req)).toBe(true);
  });

  it('bypasses the check for HEAD requests', () => {
    const req = makeRequest('HEAD');
    expect(verifyCsrf(req)).toBe(true);
  });

  it('bypasses the check for OPTIONS requests', () => {
    const req = makeRequest('OPTIONS');
    expect(verifyCsrf(req)).toBe(true);
  });

  it('returns true for POST when cookie token matches header token', () => {
    const req = makeRequest('POST', 'hs_csrf=secret-token-42', 'secret-token-42');
    expect(verifyCsrf(req)).toBe(true);
  });

  it('returns false for POST when the x-csrf-token header is missing', () => {
    const req = makeRequest('POST', 'hs_csrf=secret-token-42');
    expect(verifyCsrf(req)).toBe(false);
  });

  it('returns false for POST when the hs_csrf cookie is missing', () => {
    const req = makeRequest('POST', undefined, 'secret-token-42');
    expect(verifyCsrf(req)).toBe(false);
  });

  it('returns false for POST when cookie token and header token mismatch', () => {
    const req = makeRequest('POST', 'hs_csrf=token-a', 'token-b');
    expect(verifyCsrf(req)).toBe(false);
  });

  it('returns false for PUT when tokens are missing entirely', () => {
    const req = makeRequest('PUT');
    expect(verifyCsrf(req)).toBe(false);
  });

  it('returns true for DELETE when tokens match', () => {
    const req = makeRequest('DELETE', 'hs_csrf=deltoken', 'deltoken');
    expect(verifyCsrf(req)).toBe(true);
  });
});

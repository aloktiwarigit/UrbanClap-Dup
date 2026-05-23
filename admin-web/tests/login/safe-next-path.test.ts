// @vitest-environment node

import { describe, it, expect } from 'vitest';

// We test getSafeNextPath by importing the pure function from the login module.
// Because login/page.tsx is a 'use client' file using React, we test only the
// pure helper extracted to a separate module. The helper logic is re-exported
// from src/lib/auth/safe-next-path.ts so tests and the page both import it.
import { getSafeNextPath } from '@/lib/auth/safe-next-path';

const ALLOWED = [
  '/dashboard',
  '/orders',
  '/finance',
  '/catalogue',
  '/complaints',
  '/audit-log',
  '/admin-users',
  '/compliance',
] as const;

describe('getSafeNextPath — allowlist enforcement', () => {
  it.each(ALLOWED)('allows the exact path %s', (path) => {
    expect(getSafeNextPath(path, 'super-admin')).toBe(path);
  });

  it('allows an allowed path with a sub-path', () => {
    expect(getSafeNextPath('/orders/123', 'super-admin')).toBe('/orders/123');
  });

  it('allows an allowed path but strips query string (security: prevents param injection)', () => {
    expect(getSafeNextPath('/dashboard?foo=bar', 'super-admin')).toBe('/dashboard');
  });

  it('redirects /setup to role default (open-redirect block)', () => {
    const result = getSafeNextPath('/setup', 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('redirects //evil.com to role default (protocol-relative redirect block)', () => {
    const result = getSafeNextPath('//evil.com', 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('redirects /../../etc/passwd to role default (path traversal block)', () => {
    const result = getSafeNextPath('/../../etc/passwd', 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('redirects null next to role default', () => {
    const result = getSafeNextPath(null, 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('redirects empty string to role default', () => {
    const result = getSafeNextPath('', 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('redirects https://evil.com to role default (absolute URL block)', () => {
    const result = getSafeNextPath('https://evil.com', 'super-admin');
    expect(ALLOWED).toContain(result as typeof ALLOWED[number]);
  });

  it('returns finance default path for finance role with no next', () => {
    const result = getSafeNextPath(null, 'finance');
    expect(result).toBe('/finance');
  });
});

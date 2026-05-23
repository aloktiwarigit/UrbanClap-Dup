import { describe, it, expect } from 'vitest';
import { getSafeNextPath } from '@/lib/auth/safe-next-path';

describe('getSafeNextPath', () => {
  it('accepts bare allowed path', () => {
    expect(getSafeNextPath('/dashboard', 'super-admin')).toBe('/dashboard');
  });

  it('accepts locale-prefixed allowed path', () => {
    expect(getSafeNextPath('/hi/dashboard', 'super-admin')).toBe('/hi/dashboard');
  });

  it('accepts /en/ prefixed path', () => {
    expect(getSafeNextPath('/en/orders', 'super-admin')).toBe('/en/orders');
  });

  it('rejects path to /setup (not in ALLOWED_PATHS)', () => {
    const result = getSafeNextPath('/setup', 'super-admin');
    expect(result).not.toBe('/setup');
    expect(result).toMatch(/^\//);
  });

  it('rejects protocol-relative URLs', () => {
    const result = getSafeNextPath('//evil.com', 'super-admin');
    expect(result).not.toContain('evil.com');
  });

  it('rejects null', () => {
    const result = getSafeNextPath(null, 'super-admin');
    expect(result).toMatch(/^\//);
  });

  it('returns locale-prefixed path for /hi/catalogue/123', () => {
    expect(getSafeNextPath('/hi/catalogue/123', 'super-admin')).toBe('/hi/catalogue/123');
  });

  it('blocks path traversal through allowed segment (security fix)', () => {
    // /hi/dashboard/../admin-api/setup has `dashboard` as [1] before normalization
    // but URL.pathname normalization resolves it to /admin-api/setup before validation
    const result = getSafeNextPath('/hi/dashboard/../admin-api/setup', 'super-admin');
    expect(result).not.toContain('admin-api');
    expect(result).toMatch(/^\//);
  });

  it('strips query string from valid path (security fix)', () => {
    // Query params in `next` must not be forwarded to prevent param injection
    const result = getSafeNextPath('/hi/dashboard?injected=1&evil=2', 'super-admin');
    expect(result).toBe('/hi/dashboard');
    expect(result).not.toContain('injected');
  });

  it('rejects absolute URL open redirect', () => {
    const result = getSafeNextPath('https://evil.com/dashboard', 'super-admin');
    expect(result).not.toContain('evil.com');
    expect(result).toMatch(/^\//);
  });
});

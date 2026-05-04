// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getValidatedJwtSecret } from '@/lib/env';

describe('getValidatedJwtSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when JWT_SECRET is not set', () => {
    vi.stubEnv('JWT_SECRET', '');
    expect(() => getValidatedJwtSecret()).toThrow(/JWT_SECRET is missing or too short/);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    vi.stubEnv('JWT_SECRET', 'tooshort');
    expect(() => getValidatedJwtSecret()).toThrow(/JWT_SECRET is missing or too short/);
  });

  it('throws when JWT_SECRET is exactly 31 characters', () => {
    vi.stubEnv('JWT_SECRET', 'a'.repeat(31));
    expect(() => getValidatedJwtSecret()).toThrow(/JWT_SECRET is missing or too short/);
  });

  it('throws when JWT_SECRET is the local-dev placeholder', () => {
    vi.stubEnv('JWT_SECRET', 'local-dev-jwt-secret-placeholder-min32chars');
    expect(() => getValidatedJwtSecret()).toThrow(/local-dev placeholder/);
  });

  it('returns the secret when it is exactly 32 characters and not the placeholder', () => {
    const validSecret = 'a'.repeat(32);
    vi.stubEnv('JWT_SECRET', validSecret);
    expect(getValidatedJwtSecret()).toBe(validSecret);
  });

  it('returns the secret when it is a long valid production secret', () => {
    const validSecret = 'a-valid-production-secret-that-is-long-enough-for-hs256!!';
    vi.stubEnv('JWT_SECRET', validSecret);
    expect(getValidatedJwtSecret()).toBe(validSecret);
  });
});

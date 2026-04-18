import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('getBuildInfo', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_GIT_SHA;
    delete process.env.NEXT_PUBLIC_APP_VERSION;
  });

  it('returns sha "dev" when NEXT_PUBLIC_GIT_SHA is unset', async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '0.1.0';
    const { getBuildInfo } = await import('../src/lib/build-info');
    expect(getBuildInfo()).toEqual({ version: '0.1.0', sha: 'dev' });
  });

  it('returns the first 8 chars of NEXT_PUBLIC_GIT_SHA when set', async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '0.1.0';
    process.env.NEXT_PUBLIC_GIT_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
    const { getBuildInfo } = await import('../src/lib/build-info');
    expect(getBuildInfo()).toEqual({ version: '0.1.0', sha: 'abcdef12' });
  });

  it('falls back to version "0.0.0" when NEXT_PUBLIC_APP_VERSION is unset', async () => {
    const { getBuildInfo } = await import('../src/lib/build-info');
    expect(getBuildInfo()).toEqual({ version: '0.0.0', sha: 'dev' });
  });
});

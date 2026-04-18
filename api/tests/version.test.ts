import { describe, it, expect, afterEach } from 'vitest';
import { getVersionInfo } from '../src/shared/version.js';

describe('getVersionInfo', () => {
  const origSha = process.env.GIT_SHA;

  afterEach(() => {
    if (origSha !== undefined) process.env.GIT_SHA = origSha;
    else delete process.env.GIT_SHA;
  });

  it('returns version from package.json and commit="dev" when GIT_SHA is unset', () => {
    delete process.env.GIT_SHA;
    const info = getVersionInfo();
    expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(info.commit).toBe('dev');
  });

  it('returns the first 8 chars of GIT_SHA when set', () => {
    process.env.GIT_SHA = 'abcdef1234567890abcdef';
    const info = getVersionInfo();
    expect(info.commit).toBe('abcdef12');
    expect(info.commit.length).toBe(8);
  });
});

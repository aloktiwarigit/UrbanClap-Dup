import { describe, it, expect } from 'vitest';
import { parseCookies } from '../../src/shared/cookies.js';

describe('parseCookies', () => {
  it('parses a single cookie', () => {
    expect(parseCookies('hs_access=abc123')).toEqual({ hs_access: 'abc123' });
  });

  it('parses multiple cookies', () => {
    expect(parseCookies('hs_access=abc; hs_refresh=def')).toEqual({
      hs_access: 'abc',
      hs_refresh: 'def',
    });
  });

  it('returns empty object for empty string', () => {
    expect(parseCookies('')).toEqual({});
  });

  it('handles URL-encoded values', () => {
    const result = parseCookies('token=hello%3Dworld');
    expect(result['token']).toBe('hello=world');
  });

  it('returns empty object for undefined', () => {
    expect(parseCookies(undefined)).toEqual({});
  });
});

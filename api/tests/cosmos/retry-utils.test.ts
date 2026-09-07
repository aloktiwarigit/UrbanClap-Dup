import { describe, it, expect } from 'vitest';
import { definedOnly, isPreconditionFailure, MAX_ETAG_ATTEMPTS } from '../../src/cosmos/retry-utils.js';

describe('definedOnly', () => {
  it('drops undefined-valued keys', () => {
    const result = definedOnly({ a: 1, b: undefined, c: 'x' });
    expect(result).toEqual({ a: 1, c: 'x' });
    expect('b' in result).toBe(false);
  });

  it('keeps falsy-but-defined values (false, 0, empty string)', () => {
    const result = definedOnly({ flag: false, count: 0, name: '', missing: undefined });
    expect(result).toEqual({ flag: false, count: 0, name: '' });
  });

  it('returns an empty object when given an empty object', () => {
    expect(definedOnly({})).toEqual({});
  });
});

describe('isPreconditionFailure', () => {
  it('returns true for a 412 precondition failure', () => {
    expect(isPreconditionFailure({ code: 412 })).toBe(true);
  });

  it('returns true for a 409 conflict', () => {
    expect(isPreconditionFailure({ code: 409 })).toBe(true);
  });

  it('returns false for other error codes', () => {
    expect(isPreconditionFailure({ code: 500 })).toBe(false);
    expect(isPreconditionFailure({ code: 404 })).toBe(false);
  });

  it('returns false for an error with no code', () => {
    expect(isPreconditionFailure(new Error('boom'))).toBe(false);
    expect(isPreconditionFailure(undefined)).toBe(false);
  });
});

describe('MAX_ETAG_ATTEMPTS', () => {
  it('is 3', () => {
    expect(MAX_ETAG_ATTEMPTS).toBe(3);
  });
});

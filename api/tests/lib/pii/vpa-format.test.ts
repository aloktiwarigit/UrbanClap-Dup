import { describe, it, expect } from 'vitest';
import { isValidVpaFormat } from '../../../src/lib/pii/vpa-format.js';

describe('isValidVpaFormat', () => {
  it('accepts a well-formed VPA', () => {
    expect(isValidVpaFormat('alok.tiwari@okhdfcbank')).toBe(true);
  });

  it('accepts a short handle@psp VPA', () => {
    expect(isValidVpaFormat('ab@ybl')).toBe(true);
  });

  it('rejects a string with no @', () => {
    expect(isValidVpaFormat('alokokhdfcbank')).toBe(false);
  });

  it('rejects a string with two @ characters', () => {
    expect(isValidVpaFormat('alok@secret.handle@okaxis')).toBe(false);
  });

  it('rejects an empty local part', () => {
    expect(isValidVpaFormat('@okhdfcbank')).toBe(false);
  });

  it('rejects an empty handle part', () => {
    expect(isValidVpaFormat('alok@')).toBe(false);
  });

  it('rejects a VPA containing whitespace', () => {
    expect(isValidVpaFormat('alok tiwari@okhdfcbank')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidVpaFormat('')).toBe(false);
  });
});

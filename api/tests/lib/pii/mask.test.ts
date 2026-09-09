import { describe, it, expect } from 'vitest';
import { maskPhone, maskVpa, MASK_PLACEHOLDER } from '../../../src/lib/pii/mask.js';

describe('maskPhone', () => {
  it('keeps the last four digits of an E.164 number', () => {
    expect(maskPhone('+919876543210')).toBe('+91 XXXXX-X3210');
  });

  it('keeps the last four digits of a bare ten-digit number', () => {
    expect(maskPhone('9999999999')).toBe('+91 XXXXX-X9999');
  });

  it('returns the placeholder for an empty string', () => {
    expect(maskPhone('')).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for null and undefined', () => {
    expect(maskPhone(null)).toBe(MASK_PLACEHOLDER);
    expect(maskPhone(undefined)).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for a number shorter than four digits', () => {
    expect(maskPhone('123')).toBe(MASK_PLACEHOLDER);
  });

  it('never contains any digit other than the last four of the input', () => {
    const masked = maskPhone('+919876543210');
    expect(masked).not.toContain('98765');
    expect(masked).not.toContain('432');
  });

  it('trims whitespace before masking so padded stored values are not leaked', () => {
    expect(maskPhone('9876543210  ')).toBe(maskPhone('9876543210'));
    expect(maskPhone('  9876543210')).toBe(maskPhone('9876543210'));
  });
});

describe('maskVpa', () => {
  it('keeps the first two handle characters and the whole PSP suffix', () => {
    expect(maskVpa('alok.tiwari@okhdfcbank')).toBe('al••••••@okhdfcbank');
  });

  it('uses a fixed-width mask so handle length does not leak', () => {
    expect(maskVpa('abc@ybl')).toBe('ab••••••@ybl');
    expect(maskVpa('abcdefghijklmnop@ybl')).toBe('ab••••••@ybl');
  });

  it('masks the whole handle when it is shorter than three characters', () => {
    // Keeping two of two characters would reveal the whole handle, so a
    // handle this short is masked entirely rather than near-plaintext.
    expect(maskVpa('a@ybl')).toBe('••••••••@ybl');
    expect(maskVpa('ab@ybl')).toBe('••••••••@ybl');
  });

  it('returns the placeholder when there is no @ separator', () => {
    expect(maskVpa('notavpa')).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for empty, null and undefined', () => {
    expect(maskVpa('')).toBe(MASK_PLACEHOLDER);
    expect(maskVpa(null)).toBe(MASK_PLACEHOLDER);
    expect(maskVpa(undefined)).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for a malformed VPA with more than one @', () => {
    expect(maskVpa('ab@cd@ef')).toBe(MASK_PLACEHOLDER);
    expect(maskVpa('alok@secret.handle@okaxis')).toBe(MASK_PLACEHOLDER);
  });

  it('returns the placeholder for a trailing @ with no PSP suffix', () => {
    expect(maskVpa('alok@')).toBe(MASK_PLACEHOLDER);
  });

  it('trims whitespace before masking so padded stored values are not leaked', () => {
    expect(maskVpa('alok.tiwari@okhdfcbank  ')).toBe(maskVpa('alok.tiwari@okhdfcbank'));
    expect(maskVpa('  alok.tiwari@okhdfcbank')).toBe(maskVpa('alok.tiwari@okhdfcbank'));
  });
});

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });
}

describe('masking is not re-implemented anywhere else', () => {
  it('declares maskPhone in exactly one source file', () => {
    const offenders = walk('src')
      .filter((file) => file !== join('src', 'lib', 'pii', 'mask.ts'))
      .filter((file) => /function\s+maskPhone|const\s+maskPhone\s*=/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

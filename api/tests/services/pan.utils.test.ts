import { describe, it, expect } from 'vitest';
import { normalizePan, maskPan, hashPan } from '../../src/services/pan.utils.js';

describe('normalizePan', () => {
  it('trims leading/trailing whitespace and uppercases', () => {
    expect(normalizePan('  abcde1234f  ')).toBe('ABCDE1234F');
    expect(normalizePan('ABCDE1234F')).toBe('ABCDE1234F');
    expect(normalizePan('abcde1234f')).toBe('ABCDE1234F');
  });

  it('does not strip interior whitespace', () => {
    expect(normalizePan('ABCDE 1234F')).toBe('ABCDE 1234F');
  });
});

describe('maskPan', () => {
  it('masks first 5 chars with XXXXX for canonical 10-char PAN', () => {
    expect(maskPan('ABCDE1234F')).toBe('XXXXX1234F');
    expect(maskPan('XYZPQ9876R')).toBe('XXXXX9876R');
  });

  it('normalizes lowercase input before masking', () => {
    expect(maskPan('abcde1234f')).toBe('XXXXX1234F');
  });

  it('strips leading/trailing whitespace before masking', () => {
    expect(maskPan('  ABCDE1234F  ')).toBe('XXXXX1234F');
  });

  it('returns null for PAN with interior whitespace', () => {
    expect(maskPan('ABCDE 1234F')).toBeNull();
  });

  it('returns null for too-short PAN', () => {
    expect(maskPan('ABCDE1234')).toBeNull();
  });

  it('returns null for too-long PAN', () => {
    expect(maskPan('ABCDE12345F')).toBeNull();
  });

  it('returns null for PAN starting with a digit', () => {
    expect(maskPan('1BCDE1234F')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(maskPan('')).toBeNull();
  });

  it('returns null for PAN ending with a digit (check letter must be alpha)', () => {
    expect(maskPan('ABCDE12345')).toBeNull();
  });
});

describe('hashPan', () => {
  it('returns a 64-char lowercase hex string (SHA-256)', () => {
    const h = hashPan('ABCDE1234F');
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic — same normalized input → same hash', () => {
    expect(hashPan('ABCDE1234F')).toBe(hashPan('ABCDE1234F'));
  });

  it('normalizes before hashing — lowercase and padded inputs yield same hash', () => {
    expect(hashPan('ABCDE1234F')).toBe(hashPan('abcde1234f'));
    expect(hashPan('ABCDE1234F')).toBe(hashPan('  ABCDE1234F  '));
  });

  it('produces different hashes for different PANs', () => {
    expect(hashPan('ABCDE1234F')).not.toBe(hashPan('XYZPQ9876R'));
  });

  it('[DPDP] raw PAN cannot be retrieved from hash (one-way property)', () => {
    const h = hashPan('ABCDE1234F');
    // The hash must not contain the raw PAN as a substring
    expect(h).not.toContain('ABCDE1234F');
    expect(h).not.toContain('abcde1234f');
  });
});

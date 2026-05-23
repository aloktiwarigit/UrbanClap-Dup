import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { equalsHexHmac } from '../../src/shared/timing-safe.js';

const SECRET = 'test-secret-key';
const PAYLOAD = 'order_123|pay_456';

function validHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('equalsHexHmac', () => {
  it('returns true for correct HMAC', () => {
    const hex = validHex(SECRET, PAYLOAD);
    expect(equalsHexHmac(SECRET, PAYLOAD, hex)).toBe(true);
  });

  it('returns false for wrong digest (same length)', () => {
    // Flip the first byte of a valid hex; length stays the same
    const valid = validHex(SECRET, PAYLOAD);
    const flipped = (valid[0] === 'a' ? 'b' : 'a') + valid.slice(1);
    expect(equalsHexHmac(SECRET, PAYLOAD, flipped)).toBe(false);
  });

  it('returns false when lengths differ (non-hex chars shorten the buffer)', () => {
    // A string with non-hex chars like 'zz' is still parsed by Buffer.from
    // but produces fewer bytes than a 64-char hex string, so lengths differ.
    const shortProvided = 'deadbeef'; // 4 bytes vs 32 bytes expected
    expect(equalsHexHmac(SECRET, PAYLOAD, shortProvided)).toBe(false);
  });

  it('returns false for empty string signature', () => {
    expect(equalsHexHmac(SECRET, PAYLOAD, '')).toBe(false);
  });

  it('does not throw for completely non-hex input', () => {
    expect(() => equalsHexHmac(SECRET, PAYLOAD, 'not-valid-hex-!!!')).not.toThrow();
  });

  it('returns false for all-zero digest of correct length', () => {
    const zeros = '0'.repeat(64);
    expect(equalsHexHmac(SECRET, PAYLOAD, zeros)).toBe(false);
  });

  it('is not vulnerable to early-exit: equal-length wrong digest returns false', () => {
    const wrong = validHex('different-secret', PAYLOAD);
    expect(equalsHexHmac(SECRET, PAYLOAD, wrong)).toBe(false);
  });
});

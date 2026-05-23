import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Timing-safe HMAC-SHA256 comparison.
 *
 * Computes HMAC-SHA256(secret, payload) and compares it against providedHex
 * using a constant-time comparison to prevent timing-oracle attacks.
 *
 * Returns false if:
 *  - the provided string does not decode to the same byte-length as the digest
 *    (guards against non-hex input that Buffer.from parses to fewer bytes)
 *  - the digest does not match
 */
export function equalsHexHmac(
  secret: string,
  payload: string,
  providedHex: string,
): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(providedHex, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

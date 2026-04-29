import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// 32 bytes of 0x01, base64-encoded — deterministic valid key for tests
const VALID_KEY_B64 = Buffer.alloc(32, 1).toString('base64');

describe('piiCrypto service', () => {
  let encryptPan: (p: string) => { iv: string; ciphertext: string; tag: string; v: 1 };
  let decryptPan: (b: { iv: string; ciphertext: string; tag: string; v: 1 }) => string;

  beforeEach(async () => {
    process.env['COSMOS_PAN_ENCRYPTION_KEY'] = VALID_KEY_B64;
    const mod = await import('../../src/services/piiCrypto.service.js');
    encryptPan = mod.encryptPan;
    decryptPan = mod.decryptPan;
  });

  afterEach(() => {
    delete process.env['COSMOS_PAN_ENCRYPTION_KEY'];
  });

  it('encryptPan produces a different IV on each call (non-deterministic)', () => {
    const a = encryptPan('ABCDE1234F');
    const b = encryptPan('ABCDE1234F');
    expect(a.iv).not.toBe(b.iv);
  });

  it('decryptPan(encryptPan(plaintext)) round-trips correctly', () => {
    const plaintext = 'XYZPQ9876R';
    expect(decryptPan(encryptPan(plaintext))).toBe(plaintext);
  });

  it('tampered ciphertext causes decryptPan to throw (GCM auth tag mismatch)', () => {
    const blob = encryptPan('ABCDE1234F');
    const tampered = { ...blob, ciphertext: Buffer.from('corrupted').toString('base64') };
    expect(() => decryptPan(tampered)).toThrow();
  });

  it('tampered auth tag causes decryptPan to throw', () => {
    const blob = encryptPan('ABCDE1234F');
    // 16 bytes of zeros — different from the real tag
    const tampered = { ...blob, tag: Buffer.alloc(16, 0).toString('base64') };
    expect(() => decryptPan(tampered)).toThrow();
  });

  it('missing COSMOS_PAN_ENCRYPTION_KEY throws with a clear message', () => {
    delete process.env['COSMOS_PAN_ENCRYPTION_KEY'];
    expect(() => encryptPan('ABCDE1234F')).toThrow('COSMOS_PAN_ENCRYPTION_KEY env var not set');
  });

  it('wrong-length key (< 32 bytes) throws with a clear message', () => {
    process.env['COSMOS_PAN_ENCRYPTION_KEY'] = Buffer.from('tooshort').toString('base64');
    expect(() => encryptPan('ABCDE1234F')).toThrow('COSMOS_PAN_ENCRYPTION_KEY must be 32 bytes');
  });

  // ── P2-B: GCM auth tag length guard ──────────────────────────────────────────

  it('[P2-B] truncated auth tag (< 16 bytes) causes decryptPan to throw (prevents tag-length downgrade)', () => {
    const blob = encryptPan('ABCDE1234F');
    // 4-byte tag: only 32 bits of authentication instead of 128
    const truncated = { ...blob, tag: Buffer.alloc(4, 0).toString('base64') };
    expect(() => decryptPan(truncated)).toThrow('GCM auth tag must be exactly 16 bytes');
  });

  // ── maskPan: canonical format enforcement ─────────────────────────────────────

  it('maskPan returns masked value for canonical 10-char PAN', async () => {
    const { maskPan } = await import('../../src/services/piiCrypto.service.js');
    expect(maskPan('ABCDE1234F')).toBe('ABCDE####F');
    expect(maskPan('XYZPQ9876R')).toBe('XYZPQ####R');
  });

  it('maskPan returns null for non-canonical PAN (with space, too short, digits in wrong place)', async () => {
    const { maskPan } = await import('../../src/services/piiCrypto.service.js');
    expect(maskPan('ABCDE 1234F')).toBeNull();  // space
    expect(maskPan('ABCDE1234')).toBeNull();     // too short (9 chars)
    expect(maskPan('1BCDE1234F')).toBeNull();    // starts with digit
  });
});

import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'valid-token') return { uid: 'tech-uid-1' };
    throw new Error('INVALID_TOKEN');
  }),
}));

import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';

function req(auth?: string) {
  return new HttpRequest({
    url: 'http://localhost/test',
    method: 'GET',
    headers: auth ? { Authorization: auth } : {},
  });
}

describe('verifyTechnicianToken', () => {
  it('throws when Authorization header is missing', async () => {
    await expect(verifyTechnicianToken(req())).rejects.toThrow();
  });

  it('throws when header is present but does not start with "Bearer "', async () => {
    // The middleware uses replace('Bearer ', '') which is a substring replace, NOT a startsWith guard.
    // 'Basic xyz' has no 'Bearer ' to replace → full string forwarded to Firebase → Firebase rejects.
    // setup-totp.ts uses auth.startsWith('Bearer ') + slice(7) (the correct idiom); this middleware
    // does not — tracked as a follow-up hardening item (ADR-0014 consequences).
    await expect(verifyTechnicianToken(req('Basic xyz'))).rejects.toThrow();
  });

  it('throws when header is "Bearer " with nothing after (empty token)', async () => {
    // replace('Bearer ', '') → '' → throws 'No token' before Firebase
    await expect(verifyTechnicianToken(req('Bearer '))).rejects.toThrow();
  });

  it('throws when token uses lowercase "bearer" prefix', async () => {
    // Security note: replace('Bearer ', '') is case-sensitive and does NOT match 'bearer xyz'.
    // The full header value 'bearer xyz' is passed to verifyFirebaseIdToken, which rejects it.
    // The guard relies on Firebase rejection rather than parse-layer rejection — worth hardening.
    await expect(verifyTechnicianToken(req('bearer valid-token'))).rejects.toThrow();
  });

  it('throws when header uses tab instead of space after "Bearer"', async () => {
    // Security note: replace('Bearer ', '') does not match 'Bearer\txyz' (tab vs space).
    // Full header value is passed to Firebase, which rejects it.
    await expect(verifyTechnicianToken(req('Bearer\tvalid-token'))).rejects.toThrow();
  });

  it('throws when verifyFirebaseIdToken rejects a well-formed Bearer token', async () => {
    await expect(verifyTechnicianToken(req('Bearer bad-firebase-token'))).rejects.toThrow();
  });

  it('returns { uid } when token is valid', async () => {
    const result = await verifyTechnicianToken(req('Bearer valid-token'));
    expect(result).toEqual({ uid: 'tech-uid-1' });
  });
});

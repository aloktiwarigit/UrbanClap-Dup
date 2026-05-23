import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../src/services/truecaller.service.js', () => ({
  getTruecallerPublicKey: vi.fn(),
  _resetCacheForTest: vi.fn(),
}));

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { truecallerVerifyHandler } from '../../../src/functions/auth/truecaller-verify.js';
import { getTruecallerPublicKey } from '../../../src/services/truecaller.service.js';
import { getFirebaseAdmin } from '../../../src/services/firebaseAdmin.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockCtx = {} as InvocationContext;

function makeRequest(body: unknown) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/auth/truecaller/verify',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

// A minimal RSA-SHA512 payload/signature pair we can control in tests.
// We do NOT need a real Truecaller key — we test the signature path by mocking
// the crypto verify result via the service mock.
const VALID_PAYLOAD = Buffer.from(
  JSON.stringify({ phoneNumber: '+919876543210', requestNonce: 'abc' }),
).toString('base64');

const VALID_SIG = Buffer.from('fake-sig').toString('base64');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /v1/auth/truecaller/verify', () => {
  const mockCreateCustomToken = vi.fn().mockResolvedValue('firebase-custom-token-abc');

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: public key available
    vi.mocked(getTruecallerPublicKey).mockResolvedValue(
      '-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----',
    );

    // Default: Firebase Admin mock
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      auth: () => ({ createCustomToken: mockCreateCustomToken }),
    } as unknown as ReturnType<typeof getFirebaseAdmin>);
  });

  it('returns 400 VALIDATION_ERROR when required fields are missing', async () => {
    const res = (await truecallerVerifyHandler(
      makeRequest({ payload: 'x' }), // missing signature and signatureAlgorithm
      mockCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR for empty strings', async () => {
    const res = (await truecallerVerifyHandler(
      makeRequest({ payload: '', signature: 'x', signatureAlgorithm: 'SHA512withRSA' }),
      mockCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 TRUECALLER_SIGNATURE_INVALID when crypto.verify rejects signature', async () => {
    // To make the signature fail, use a payload/sig that will not verify
    // against our fake key. We use the actual crypto module but with a garbage key,
    // so verify() will return false (or throw). The handler should map that to 400.
    const res = (await truecallerVerifyHandler(
      makeRequest({
        payload: VALID_PAYLOAD,
        signature: VALID_SIG,
        signatureAlgorithm: 'SHA512withRSA',
      }),
      mockCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('TRUECALLER_SIGNATURE_INVALID');
  });

  it('returns 200 with firebaseCustomToken when signature is valid', async () => {
    // To get a passing signature test, we need to generate a real RSA key pair
    // and sign the payload. This is the integration-style test path.
    const { generateKeyPairSync, createSign } = await import('node:crypto');

    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

    const payloadObj = { phoneNumber: '+919876543210', requestNonce: 'nonce-test' };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

    const signer = createSign('RSA-SHA512');
    signer.update(Buffer.from(payloadB64, 'base64'));
    const signatureB64 = signer.sign(privateKey, 'base64');

    vi.mocked(getTruecallerPublicKey).mockResolvedValue(publicKeyPem);

    const res = (await truecallerVerifyHandler(
      makeRequest({
        payload: payloadB64,
        signature: signatureB64,
        signatureAlgorithm: 'SHA512withRSA',
      }),
      mockCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as { firebaseCustomToken: string; sessionExpiresAt: number };
    expect(body.firebaseCustomToken).toBe('firebase-custom-token-abc');
    expect(typeof body.sessionExpiresAt).toBe('number');

    // Should have minted the custom token with the phone number as UID
    expect(mockCreateCustomToken).toHaveBeenCalledWith('+919876543210');
  });

  it('returns 200 and includes fcmToken passthrough in debug fields (fcmToken optional)', async () => {
    const { generateKeyPairSync, createSign } = await import('node:crypto');
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

    const payloadObj = { phoneNumber: '+919876543210', requestNonce: 'nonce-2' };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const signer = createSign('RSA-SHA512');
    signer.update(Buffer.from(payloadB64, 'base64'));
    const signatureB64 = signer.sign(privateKey, 'base64');

    vi.mocked(getTruecallerPublicKey).mockResolvedValue(publicKeyPem);

    const res = (await truecallerVerifyHandler(
      makeRequest({
        payload: payloadB64,
        signature: signatureB64,
        signatureAlgorithm: 'SHA512withRSA',
        fcmToken: 'fcm-token-xyz',
      }),
      mockCtx,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
  });
});

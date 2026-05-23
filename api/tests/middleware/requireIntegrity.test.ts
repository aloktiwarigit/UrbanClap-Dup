import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

// Mock Sentry before import
vi.mock('@sentry/node', () => ({
  withScope: vi.fn((_cb: (scope: { setLevel: () => void }) => void) =>
    _cb({ setLevel: vi.fn() }),
  ),
  captureMessage: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

/**
 * Build a minimal PATCH request with an optional X-Integrity-Token header.
 */
function makeReq(opts: {
  url?: string;
  token?: string;
  headers?: Record<string, string>;
}): HttpRequest {
  return new HttpRequest({
    url: opts.url ?? 'http://localhost/api/v1/technicians/active-job/bk-1/transition',
    method: 'PATCH',
    headers: {
      ...(opts.token ? { 'x-integrity-token': opts.token } : {}),
      ...(opts.headers ?? {}),
    },
    body: { string: '{}' },
  });
}

/** Dummy handler that always returns 200 OK. */
const okHandler = vi.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });

describe('requireIntegrity middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Default: non-strict mode (PLAY_INTEGRITY_STRICT not set to "true")
    delete process.env['PLAY_INTEGRITY_STRICT'];
    delete process.env['PLAY_INTEGRITY_PACKAGE_NAME'];
  });

  afterEach(() => {
    delete process.env['PLAY_INTEGRITY_STRICT'];
    delete process.env['PLAY_INTEGRITY_PACKAGE_NAME'];
  });

  // ─── Non-strict mode (default / dev / staging) ───────────────────────────

  it('absent token + non-strict → warns to Sentry and allows (200)', async () => {
    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');
    const { captureMessage } = await import('@sentry/node');

    const wrapped = requireIntegrity(okHandler);
    const res = (await wrapped(makeReq({}), new InvocationContext())) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(captureMessage).toHaveBeenCalledOnce();
    const msg = (captureMessage as MockFn).mock.calls[0]![0] as string;
    expect(msg).toMatch(/missing/i);
  });

  it('debug-bypass token + non-strict → allows (200) without calling Google API', async () => {
    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');

    const wrapped = requireIntegrity(okHandler);
    const res = (await wrapped(
      makeReq({ token: 'debug-bypass' }),
      new InvocationContext(),
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
  });

  it('debug-bypass token + strict=false env → allows (200)', async () => {
    process.env['PLAY_INTEGRITY_STRICT'] = 'false';
    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');

    const wrapped = requireIntegrity(okHandler);
    const res = (await wrapped(
      makeReq({ token: 'debug-bypass' }),
      new InvocationContext(),
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
  });

  // ─── Strict mode ─────────────────────────────────────────────────────────

  it('absent token + strict mode → rejects with 403 INTEGRITY_MISSING', async () => {
    process.env['PLAY_INTEGRITY_STRICT'] = 'true';
    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');

    const wrapped = requireIntegrity(okHandler);
    const res = (await wrapped(makeReq({}), new InvocationContext())) as HttpResponseInit;

    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INTEGRITY_MISSING');
  });

  it('invalid token (Google API returns bad verdict) + strict → rejects 403 INTEGRITY_FAILED', async () => {
    process.env['PLAY_INTEGRITY_STRICT'] = 'true';
    process.env['PLAY_INTEGRITY_PACKAGE_NAME'] = 'com.homeservices.technician';

    // Mock the Google decodeIntegrityToken fetch call to return an UNAPPROACHABLE verdict
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenPayloadExternal: {
          requestDetails: { requestPackageName: 'com.homeservices.technician', requestHash: 'wrong-nonce' },
          appIntegrity: { appRecognitionVerdict: 'UNAPPROACHABLE' },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');

    const wrapped = requireIntegrity(okHandler, { expectedNonce: 'correct-nonce' });
    const res = (await wrapped(
      makeReq({ token: 'some-real-looking-token' }),
      new InvocationContext(),
    )) as HttpResponseInit;

    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('INTEGRITY_FAILED');

    vi.unstubAllGlobals();
  });

  it('valid token with matching nonce + strict → allows (200)', async () => {
    process.env['PLAY_INTEGRITY_STRICT'] = 'true';
    process.env['PLAY_INTEGRITY_PACKAGE_NAME'] = 'com.homeservices.technician';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tokenPayloadExternal: {
          requestDetails: {
            requestPackageName: 'com.homeservices.technician',
            requestHash: 'matching-nonce',
          },
          appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED' },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');

    const wrapped = requireIntegrity(okHandler, { expectedNonce: 'matching-nonce' });
    const res = (await wrapped(
      makeReq({ token: 'valid-token' }),
      new InvocationContext(),
    )) as HttpResponseInit;

    expect(res.status).toBe(200);

    vi.unstubAllGlobals();
  });

  // ─── Fail-open on Google API errors ──────────────────────────────────────

  it('Google API throws + non-strict → warns and allows (200)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', fetchMock);

    const { requireIntegrity } = await import('../../src/middleware/requireIntegrity.js');
    const { captureMessage } = await import('@sentry/node');

    const wrapped = requireIntegrity(okHandler, { expectedNonce: 'some-nonce' });
    const res = (await wrapped(
      makeReq({ token: 'some-token' }),
      new InvocationContext(),
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(captureMessage).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

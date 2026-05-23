import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

// ── Mocks (all declared before any import of production code) ─────────────────

vi.mock('../src/cosmos/rate-limit-repository.js', () => ({
  consume: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('../src/cosmos/repositories/waitlist.repository.js', () => ({
  createWaitlistEntry: vi.fn().mockResolvedValue({
    id: 'wl-1',
    phone: '+916000000001',
    lat: 26.7,
    lng: 82.1,
    serviceId: 'ac-deep-clean',
    requestedAt: new Date().toISOString(),
    sourceIp: '1.2.3.4',
    createdAt: new Date().toISOString(),
  }),
}));

vi.mock('../src/data/catalogue-ids.js', () => ({
  CATALOGUE_SERVICE_IDS: ['ac-deep-clean', 'ac-gas-refill', 'plumbing-leak-fix'],
}));

// Import handler AFTER mocks are registered
import { waitlistHandler } from '../src/functions/waitlist.js';
import { consume } from '../src/cosmos/rate-limit-repository.js';
import { createWaitlistEntry } from '../src/cosmos/repositories/waitlist.repository.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function postReq(body: unknown, headers: Record<string, string> = {}) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/waitlist',
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json', ...headers },
  });
}

const validBody = () => ({
  phone: '+916000000001',
  lat: 26.7,
  lng: 82.1,
  serviceId: 'ac-deep-clean',
  requestedAt: nowIso(),
});

const mockCtx = { log: vi.fn(), error: vi.fn(), warn: vi.fn() } as never;

// ── Test suite ────────────────────────────────────────────────────────────────

describe('POST /v1/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset consume to allow by default
    vi.mocked(consume).mockResolvedValue({ allowed: true });
  });

  it('validBody_returns201_andWritesCosmosDoc', async () => {
    const res = (await waitlistHandler(postReq(validBody()), mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const body = res.jsonBody as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(createWaitlistEntry).toHaveBeenCalledOnce();
  });

  it('invalidPhoneFormat_returns400_VALIDATION_ERROR', async () => {
    const res = (await waitlistHandler(
      postReq({ ...validBody(), phone: '12345' }),
      mockCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(createWaitlistEntry).not.toHaveBeenCalled();
  });

  it('latLngOutOfRange_returns400', async () => {
    const res = (await waitlistHandler(
      postReq({ ...validBody(), lat: 999 }),
      mockCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('requestedAtSkew_over90s_returns400', async () => {
    const staleTs = new Date(Date.now() - 120_000).toISOString(); // 2 minutes ago
    const res = (await waitlistHandler(
      postReq({ ...validBody(), requestedAt: staleTs }),
      mockCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('CLOCK_SKEW');
  });

  it('unknownServiceId_returns400_UNKNOWN_SERVICE', async () => {
    const res = (await waitlistHandler(
      postReq({ ...validBody(), serviceId: 'nonexistent-service-xyz' }),
      mockCtx,
    )) as HttpResponseInit;
    expect(res.status).toBe(400);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('UNKNOWN_SERVICE');
    expect(createWaitlistEntry).not.toHaveBeenCalled();
  });

  it('rateLimit_6thRequestForSamePhone_returns429_withRetryAfter', async () => {
    // First call (IP check) passes; second call (phone check) is denied
    vi.mocked(consume)
      .mockResolvedValueOnce({ allowed: true })         // IP bucket — allowed
      .mockResolvedValueOnce({ allowed: false, retryAfterMs: 3_600_000 }); // phone bucket — denied

    const res = (await waitlistHandler(postReq(validBody()), mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(429);
    const headers = res.headers as Record<string, string>;
    expect(headers['Retry-After']).toBeDefined();
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('RATE_LIMITED');
    expect(createWaitlistEntry).not.toHaveBeenCalled();
  });

  it('noAuth_required_anonRequestSucceeds', async () => {
    // No Authorization header — should still succeed (authLevel: anonymous)
    const req = postReq(validBody()); // no auth header
    const res = (await waitlistHandler(req, mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(201);
  });

  it('rateLimit_ipBucketDenied_returns429_withRetryAfter', async () => {
    // First call (IP check) is denied — phone check should not be reached.
    vi.mocked(consume).mockResolvedValueOnce({ allowed: false, retryAfterMs: 1_500 });

    const res = (await waitlistHandler(postReq(validBody()), mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(429);
    const headers = res.headers as Record<string, string>;
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('RATE_LIMITED');
    expect(createWaitlistEntry).not.toHaveBeenCalled();
    // Phone-bucket consume must NOT be called when IP bucket already denied.
    expect(vi.mocked(consume).mock.calls).toHaveLength(1);
  });

  it('invalidJson_returns400_INVALID_JSON', async () => {
    // Build a request whose body is non-JSON garbage so req.json() throws.
    const req = new HttpRequest({
      url: 'http://localhost/api/v1/waitlist',
      method: 'POST',
      body: { string: '{not-json' },
      headers: { 'content-type': 'application/json' },
    });
    const res = (await waitlistHandler(req, mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(400);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('INVALID_JSON');
    expect(createWaitlistEntry).not.toHaveBeenCalled();
  });

  it('joinWaitlist_genericError_returns500_INTERNAL_ERROR', async () => {
    // Repository throws a non-UNKNOWN_SERVICE error (e.g. Cosmos outage).
    vi.mocked(createWaitlistEntry).mockRejectedValueOnce(new Error('Cosmos 503'));

    const res = (await waitlistHandler(postReq(validBody()), mockCtx)) as HttpResponseInit;
    expect(res.status).toBe(500);
    const body = res.jsonBody as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});

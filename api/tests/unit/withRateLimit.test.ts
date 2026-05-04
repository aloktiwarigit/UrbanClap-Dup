import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext, HttpResponseInit } from '@azure/functions';

// ── Mock rate-limit-repository (use vi.hoisted to avoid TDZ issue) ─────────
const { mockConsume } = vi.hoisted(() => ({ mockConsume: vi.fn() }));
vi.mock('../../src/cosmos/rate-limit-repository.js', () => ({
  consume: mockConsume,
}));

import { withRateLimit } from '../../src/middleware/withRateLimit.js';

const fakeCtx = {} as InvocationContext;

function makeReq(opts: { url?: string; ip?: string } = {}): HttpRequest {
  const headers: Record<string, string> = {};
  if (opts.ip) headers['x-forwarded-for'] = opts.ip;
  return new HttpRequest({
    url: opts.url ?? 'http://localhost/api/v1/admin/auth/login',
    method: 'POST',
    headers,
  });
}

const defaultBuckets = { ip: { capacity: 10, refillPerSec: 10 / 60 } };

describe('withRateLimit — within budget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsume.mockResolvedValue({ allowed: true });
  });

  it('calls the wrapped handler when allowed', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200, jsonBody: { ok: true } });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const res = await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    expect(inner).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it('passes original request and context to inner handler', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);
    const req = makeReq({ ip: '1.2.3.4' });

    await wrapped(req, fakeCtx);
    expect(inner).toHaveBeenCalledWith(req, fakeCtx);
  });
});

describe('withRateLimit — over budget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 429 when consume returns allowed=false', async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 6000 });
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const res = await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(429);
    expect(inner).not.toHaveBeenCalled();
  });

  it('includes Retry-After header in seconds when rate-limited', async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 6000 });
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const res = await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    const headers = res.headers as Record<string, string> | undefined;
    expect(headers?.['Retry-After']).toBe('6');
  });

  it('rounds Retry-After up to nearest second', async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 6001 });
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const res = await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    const headers = res.headers as Record<string, string> | undefined;
    expect(headers?.['Retry-After']).toBe('7');
  });
});

describe('withRateLimit — webhook exemption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate consume returning denied — exempted paths should bypass this
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 6000 });
  });

  it('exempts /v1/webhooks/ paths even when bucket is exhausted', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200, jsonBody: { received: true } });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const req = makeReq({ url: 'http://localhost/api/v1/webhooks/razorpay', ip: '1.2.3.4' });
    const res = await wrapped(req, fakeCtx) as HttpResponseInit;
    expect(inner).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    // consume should NOT have been called for exempt path
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it('does not exempt non-webhook admin paths', async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 6000 });
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const req = makeReq({ url: 'http://localhost/api/v1/admin/auth/login', ip: '1.2.3.4' });
    const res = await wrapped(req, fakeCtx) as HttpResponseInit;
    expect(res.status).toBe(429);
    expect(inner).not.toHaveBeenCalled();
  });

  it('custom exempt function bypasses rate limiting', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({
      buckets: defaultBuckets,
      exempt: (req) => req.url.includes('/health'),
    })(inner);

    const req = makeReq({ url: 'http://localhost/api/v1/health', ip: '1.2.3.4' });
    const res = await wrapped(req, fakeCtx) as HttpResponseInit;
    expect(inner).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    expect(mockConsume).not.toHaveBeenCalled();
  });
});

describe('withRateLimit — fail-open on Cosmos error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes request to handler when consume throws (fail-open)', async () => {
    mockConsume.mockRejectedValue(new Error('Cosmos unavailable'));
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    const res = await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    expect(inner).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('withRateLimit — IP key derivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsume.mockResolvedValue({ allowed: true });
  });

  it('passes x-forwarded-for IP as part of the bucket key', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    await wrapped(makeReq({ ip: '10.0.0.1' }), fakeCtx);
    const key: string = mockConsume.mock.calls[0]?.[0] as string;
    expect(key).toContain('10.0.0.1');
  });

  it('uses fallback key when no IP header present', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    await wrapped(makeReq(), fakeCtx);
    // Should still call consume (with some key, not crash)
    expect(mockConsume).toHaveBeenCalledOnce();
  });
});

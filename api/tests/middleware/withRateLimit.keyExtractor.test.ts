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
    url: opts.url ?? 'http://localhost/api/v1/technicians/location',
    method: 'POST',
    headers,
  });
}

const defaultBuckets = { ip: { capacity: 10, refillPerSec: 10 / 60 } };

describe('withRateLimit — keyExtractor absent (default IP-based bucket)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsume.mockResolvedValue({ allowed: true });
  });

  it('uses rl:ip:<ip> as the bucket key when no keyExtractor is provided', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx);

    expect(mockConsume).toHaveBeenCalledOnce();
    const key: string = mockConsume.mock.calls[0]![0] as string;
    expect(key).toBe('rl:ip:1.2.3.4');
  });

  it('falls back to rl:ip:unknown when no IP header is present', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets })(inner);

    await wrapped(makeReq(), fakeCtx);

    const key: string = mockConsume.mock.calls[0]![0] as string;
    expect(key).toBe('rl:ip:unknown');
  });
});

describe('withRateLimit — keyExtractor present (custom bucket key)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsume.mockResolvedValue({ allowed: true });
  });

  it('uses the keyExtractor return value as the bucket key instead of the IP key', async () => {
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({
      buckets: defaultBuckets,
      keyExtractor: () => 'rl:tech:uid-abc123',
    })(inner);

    await wrapped(makeReq({ ip: '1.2.3.4' }), fakeCtx);

    expect(mockConsume).toHaveBeenCalledOnce();
    const key: string = mockConsume.mock.calls[0]![0] as string;
    expect(key).toBe('rl:tech:uid-abc123');
    // Must NOT fall back to the IP-based key
    expect(key).not.toContain('rl:ip:');
  });

  it('passes the HttpRequest to the keyExtractor', async () => {
    const keyExtractor = vi.fn().mockReturnValue('rl:tech:uid-xyz');
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets, keyExtractor })(inner);

    const req = makeReq({ ip: '5.6.7.8' });
    await wrapped(req, fakeCtx);

    expect(keyExtractor).toHaveBeenCalledOnce();
    expect(keyExtractor).toHaveBeenCalledWith(req);
  });

  it('is not called for exempted webhook paths', async () => {
    const keyExtractor = vi.fn().mockReturnValue('rl:tech:should-not-be-called');
    const inner = vi.fn().mockResolvedValue({ status: 200 });
    const wrapped = withRateLimit({ buckets: defaultBuckets, keyExtractor })(inner);

    const req = makeReq({ url: 'http://localhost/api/v1/webhooks/razorpay', ip: '1.2.3.4' });
    await wrapped(req, fakeCtx);

    expect(keyExtractor).not.toHaveBeenCalled();
    expect(mockConsume).not.toHaveBeenCalled();
    expect(inner).toHaveBeenCalledOnce();
  });
});

describe('withRateLimit — keyExtractor bucket isolation', () => {
  it('two different keyExtractor values result in independent rate-limit buckets', async () => {
    // Bucket A is exhausted; bucket B still has tokens.
    const callCounts: Record<string, number> = {};
    mockConsume.mockImplementation(async (key: string) => {
      callCounts[key] = (callCounts[key] ?? 0) + 1;
      if (key === 'rl:tech:uid-A') {
        return { allowed: false, retryAfterMs: 5000 };
      }
      return { allowed: true };
    });

    const innerA = vi.fn().mockResolvedValue({ status: 200, jsonBody: { caller: 'A' } });
    const innerB = vi.fn().mockResolvedValue({ status: 200, jsonBody: { caller: 'B' } });

    const wrappedA = withRateLimit({
      buckets: defaultBuckets,
      keyExtractor: () => 'rl:tech:uid-A',
    })(innerA);

    const wrappedB = withRateLimit({
      buckets: defaultBuckets,
      keyExtractor: () => 'rl:tech:uid-B',
    })(innerB);

    const resA = await wrappedA(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;
    const resB = await wrappedB(makeReq({ ip: '1.2.3.4' }), fakeCtx) as HttpResponseInit;

    // Bucket A is throttled → 429, innerA should NOT have been called
    expect(resA.status).toBe(429);
    expect(innerA).not.toHaveBeenCalled();

    // Bucket B is independent → 200, innerB should have been called
    expect(resB.status).toBe(200);
    expect(innerB).toHaveBeenCalledOnce();

    // Each handler consumed from its own key
    expect(callCounts['rl:tech:uid-A']).toBe(1);
    expect(callCounts['rl:tech:uid-B']).toBe(1);
  });
});

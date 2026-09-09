import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Cosmos mock setup ──────────────────────────────────────────────────────
const mockRead = vi.fn();
const mockCreate = vi.fn();
const mockReplace = vi.fn();
const mockItem = vi.fn((_id: string) => ({
  read: mockRead,
  replace: mockReplace,
}));
const mockItems = { create: mockCreate };

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        item: mockItem,
        items: mockItems,
      }),
    }),
  }),
  DB_NAME: 'homeservices',
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: (cb: (s: unknown) => void) => cb({ setLevel: vi.fn() }),
}));

import { consume, consumeStrict } from '../../src/cosmos/rate-limit-repository.js';

// ── Helper: build a bucket doc ────────────────────────────────────────────
function makeDoc(tokens: number, lastRefillAtMs = Date.now()) {
  return { id: 'test-key', tokens, lastRefillAtMs };
}

describe('consume — within budget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('returns allowed=true when tokens >= 1 (existing doc)', async () => {
    mockRead.mockResolvedValue({ resource: makeDoc(5) });
    mockReplace.mockResolvedValue({ resource: makeDoc(4) });

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBeUndefined();
    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it('refills tokens proportional to elapsed time before consuming', async () => {
    const now = Date.now();
    const sixtySecondsAgo = now - 60_000;
    vi.setSystemTime(now);

    mockRead.mockResolvedValue({ resource: makeDoc(0, sixtySecondsAgo) });
    mockReplace.mockResolvedValue({ resource: makeDoc(9) });

    // capacity=10, refillPerSec=10/60 → after 60s tokens = 0 + 60*(10/60)=10 → capped at 10 → after consume = 9
    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    // Verify replace was called with tokens near 9
    const calledDoc = mockReplace.mock.calls[0]?.[0] as { tokens: number };
    expect(calledDoc.tokens).toBeCloseTo(9, 1);

    vi.useRealTimers();
  });

  it('caps refilled tokens at capacity', async () => {
    const now = Date.now();
    // far in the past — would refill way past capacity
    vi.setSystemTime(now);
    mockRead.mockResolvedValue({ resource: makeDoc(2, now - 1_000_000) });
    mockReplace.mockResolvedValue({ resource: makeDoc(9) });

    await consume('test-key', 10, 10 / 60);
    const calledDoc = mockReplace.mock.calls[0]?.[0] as { tokens: number };
    expect(calledDoc.tokens).toBeLessThanOrEqual(9 + 1); // consumed 1 from capped 10

    vi.useRealTimers();
  });
});

describe('consume — over budget (tokens < 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('returns allowed=false with retryAfterMs when no tokens remain', async () => {
    vi.setSystemTime(Date.now());
    mockRead.mockResolvedValue({ resource: makeDoc(0) }); // 0 tokens, same ms → no refill

    const refillPerSec = 10 / 60;
    const result = await consume('test-key', 10, refillPerSec);
    expect(result.allowed).toBe(false);
    expect(typeof result.retryAfterMs).toBe('number');
    expect((result.retryAfterMs as number)).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('retryAfterMs equals Math.ceil((1 - tokens) / refillPerSec * 1000)', async () => {
    const now = Date.now();
    vi.setSystemTime(now);
    // tokens = 0, lastRefillAtMs = now → no refill
    mockRead.mockResolvedValue({ resource: makeDoc(0, now) });

    const refillPerSec = 10 / 60;
    const result = await consume('test-key', 10, refillPerSec);
    const expected = Math.ceil((1 - 0) / refillPerSec * 1000);
    expect(result.retryAfterMs).toBe(expected);

    vi.useRealTimers();
  });

  it('does not call replace when tokens < 1', async () => {
    const now = Date.now();
    vi.setSystemTime(now);
    mockRead.mockResolvedValue({ resource: makeDoc(0, now) });

    await consume('test-key', 10, 10 / 60);
    expect(mockReplace).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

describe('consume — new key (404 → create)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('creates a new doc when Cosmos returns 404 and allows the request', async () => {
    const err = Object.assign(new Error('Not found'), { code: 404 });
    mockRead.mockRejectedValue(err);
    mockCreate.mockResolvedValue({ resource: { id: 'test-key', tokens: 9, lastRefillAtMs: Date.now() } });

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    expect(mockCreate).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});

describe('consume — concurrent 412 retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('retries once on 412 and succeeds on second attempt', async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const firstDoc = makeDoc(5, now);
    const secondDoc = makeDoc(5, now);
    const err412 = Object.assign(new Error('Precondition failed'), { code: 412 });

    mockRead
      .mockResolvedValueOnce({ resource: firstDoc, etag: 'etag-1' })
      .mockResolvedValueOnce({ resource: secondDoc, etag: 'etag-2' });
    mockReplace
      .mockRejectedValueOnce(err412)
      .mockResolvedValueOnce({ resource: makeDoc(4) });

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    expect(mockReplace).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('returns allowed=true (fail-open) when 412 persists on retry', async () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const doc = makeDoc(5, now);
    const err412 = Object.assign(new Error('Precondition failed'), { code: 412 });

    mockRead.mockResolvedValue({ resource: doc, etag: 'etag-1' });
    mockReplace.mockRejectedValue(err412);

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);

    vi.useRealTimers();
  });
});

describe('consume — fail-open on Cosmos error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns allowed=true when Cosmos throws an unexpected error', async () => {
    mockRead.mockRejectedValue(new Error('Cosmos throttled'));

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
  });

  it('does not throw even when Cosmos is completely unavailable', async () => {
    mockRead.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(consume('test-key', 10, 10 / 60)).resolves.toBeDefined();
  });
});

describe('consumeStrict — fails CLOSED (used by the PII reveal endpoint)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates the Cosmos error instead of failing open', async () => {
    mockRead.mockRejectedValue(new Error('Cosmos throttled'));

    await expect(consumeStrict('test-key', 10, 10 / 60)).rejects.toThrow('Cosmos throttled');
  });

  it('throws instead of failing open when 412 persists on retry', async () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const doc = makeDoc(5, now);
    const err412 = Object.assign(new Error('Precondition failed'), { code: 412 });
    mockRead.mockResolvedValue({ resource: doc, etag: 'etag-1' });
    mockReplace.mockRejectedValue(err412);

    await expect(consumeStrict('test-key', 10, 10 / 60)).rejects.toThrow();

    vi.useRealTimers();
  });

  it('still allows normally when tokens are available (same algorithm as consume)', async () => {
    mockRead.mockResolvedValue({ resource: makeDoc(5) });
    mockReplace.mockResolvedValue({ resource: makeDoc(4) });

    const result = await consumeStrict('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
  });

  it('does not call Sentry.captureException itself — the caller decides how to report the failure', async () => {
    const Sentry = await import('@sentry/node');
    mockRead.mockRejectedValue(new Error('Cosmos throttled'));

    await expect(consumeStrict('test-key', 10, 10 / 60)).rejects.toThrow();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});

// Codex round 4, Finding 1: a create conflict (409) on a brand-new bucket key
// is a healthy-store race between two concurrent first requests, NOT a store
// outage — it must not surface as RATE_LIMIT_UNAVAILABLE/503 under
// consumeStrict. See docs/reviews/codex-20260909-0838-round4.md.
describe('consume/consumeStrict — concurrent create conflict (409) on a new bucket key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('retries once on a 409 create conflict and returns allowed=true against the doc the other writer created', async () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const err404 = Object.assign(new Error('Not found'), { code: 404 });
    const err409 = Object.assign(new Error('Conflict'), { code: 409 });

    // First read: bucket doesn't exist yet. Our create loses the race (409).
    // Second read (the retry): the other writer's doc is now there.
    mockRead
      .mockRejectedValueOnce(err404)
      .mockResolvedValueOnce({ resource: makeDoc(9, now), etag: 'etag-1' });
    mockCreate.mockRejectedValueOnce(err409);
    mockReplace.mockResolvedValueOnce({ resource: makeDoc(8, now) });

    const result = await consumeStrict('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockReplace).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('propagates a non-409 create error through consumeStrict instead of retrying', async () => {
    const err404 = Object.assign(new Error('Not found'), { code: 404 });
    const errOther = new Error('Cosmos throttled during create');
    mockRead.mockRejectedValue(err404);
    mockCreate.mockRejectedValue(errOther);

    await expect(consumeStrict('test-key', 10, 10 / 60)).rejects.toThrow(
      'Cosmos throttled during create',
    );
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('bounds the create-conflict retry to one attempt: a second consecutive 409 fails CLOSED under consumeStrict', async () => {
    const err404 = Object.assign(new Error('Not found'), { code: 404 });
    const err409 = Object.assign(new Error('Conflict'), { code: 409 });
    // Every read still sees no doc, and every create loses — bound the retry
    // instead of looping forever.
    mockRead.mockRejectedValue(err404);
    mockCreate.mockRejectedValue(err409);

    await expect(consumeStrict('test-key', 10, 10 / 60)).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockRead).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('bounds the create-conflict retry to one attempt: fails OPEN (not throw) under consume when retries are exhausted', async () => {
    const err404 = Object.assign(new Error('Not found'), { code: 404 });
    const err409 = Object.assign(new Error('Conflict'), { code: 409 });
    mockRead.mockRejectedValue(err404);
    mockCreate.mockRejectedValue(err409);

    const result = await consume('test-key', 10, 10 / 60);
    expect(result.allowed).toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

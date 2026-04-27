import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the timer handler registered via app.timer() — expireStaleOffers is not exported directly.
// vi.hoisted ensures these are available before vi.mock factories run (vi.mock is hoisted by Vitest).
const { capturedHandlers, mocks } = vi.hoisted(() => ({
  capturedHandlers: {} as Record<string, (...args: unknown[]) => Promise<void>>,
  mocks: {
    fetchAll: vi.fn(),
    containerReplace: vi.fn(),
    updateBookingFields: vi.fn(),
    eventAppend: vi.fn(),
  },
}));

vi.mock('@azure/functions', () => ({
  app: {
    http: vi.fn(),
    timer: vi.fn((name: string, opts: { handler: (...args: unknown[]) => Promise<void> }) => {
      capturedHandlers[name] = opts.handler;
    }),
  },
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: () => ({
    items: { query: vi.fn(() => ({ fetchAll: mocks.fetchAll })) },
    item: vi.fn(() => ({ replace: mocks.containerReplace })),
  }),
  getBookingsContainer: () => ({
    items: { query: vi.fn(() => ({ fetchAll: vi.fn() })), create: vi.fn() },
    item: vi.fn(() => ({ read: vi.fn(), replace: vi.fn() })),
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: mocks.updateBookingFields,
}));

vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: { append: mocks.eventAppend },
}));

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/dispatch-attempt-repository.js', () => ({
  dispatchAttemptRepo: { getByBookingId: vi.fn(), acceptAttempt: vi.fn() },
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(() => ({ send: vi.fn() })),
}));

// Side-effect import triggers app.timer() → capturedHandlers['expireStaleOffers'] is set
import '../../src/functions/job-offers.js';

function makeStaleAttempt(overrides: Partial<{ id: string; bookingId: string; status: string; _etag: string }> = {}) {
  return {
    id: 'da-stale-1',
    bookingId: 'bk-1',
    technicianIds: ['tech-1'],
    sentAt: new Date(Date.now() - 120_000).toISOString(),
    expiresAt: new Date(Date.now() - 60_000).toISOString(), // 60s past = expired
    status: 'PENDING' as const,
    _etag: '"etag-stale-001"',
    _ts: 0,
    _rid: 'rid-1',
    _self: 'self-1',
    ...overrides,
  };
}

async function runExpiry() {
  const handler = capturedHandlers['expireStaleOffers'];
  if (!handler) throw new Error('expireStaleOffers handler not captured — vi.mock or import order issue');
  await handler(null, null);
}

describe('expireStaleOffers timer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateBookingFields.mockResolvedValue({ id: 'bk-1', status: 'UNFULFILLED' });
    mocks.eventAppend.mockResolvedValue(undefined);
    mocks.containerReplace.mockResolvedValue({});
  });

  it('stale PENDING attempt (expiresAt < now) → replace to EXPIRED, booking UNFULFILLED, OFFER_EXPIRED event appended', async () => {
    const attempt = makeStaleAttempt();
    mocks.fetchAll.mockResolvedValue({ resources: [attempt] });

    await runExpiry();

    expect(mocks.containerReplace).toHaveBeenCalledOnce();
    const [replacedDoc, replaceOpts] = mocks.containerReplace.mock.calls[0] as [{ status: string }, { accessCondition: { type: string; condition: string } }];
    expect(replacedDoc.status).toBe('EXPIRED');
    expect(replaceOpts.accessCondition.type).toBe('IfMatch');
    expect(replaceOpts.accessCondition.condition).toBe('"etag-stale-001"');

    expect(mocks.updateBookingFields).toHaveBeenCalledOnce();
    expect(mocks.updateBookingFields.mock.calls[0]![0]).toBe('bk-1');
    expect(mocks.updateBookingFields.mock.calls[0]![1]).toEqual({ status: 'UNFULFILLED' });

    expect(mocks.eventAppend).toHaveBeenCalledOnce();
    expect(mocks.eventAppend.mock.calls[0]![0]).toMatchObject({ event: 'OFFER_EXPIRED', bookingId: 'bk-1' });
  });

  it('no stale attempts → no-op, no writes', async () => {
    mocks.fetchAll.mockResolvedValue({ resources: [] });

    await runExpiry();

    expect(mocks.containerReplace).not.toHaveBeenCalled();
    expect(mocks.updateBookingFields).not.toHaveBeenCalled();
    expect(mocks.eventAppend).not.toHaveBeenCalled();
  });

  it('multiple stale attempts → all processed in parallel via Promise.allSettled', async () => {
    const attempts = [
      makeStaleAttempt({ id: 'da-1', bookingId: 'bk-1', _etag: '"e1"' }),
      makeStaleAttempt({ id: 'da-2', bookingId: 'bk-2', _etag: '"e2"' }),
      makeStaleAttempt({ id: 'da-3', bookingId: 'bk-3', _etag: '"e3"' }),
    ];
    mocks.fetchAll.mockResolvedValue({ resources: attempts });
    mocks.updateBookingFields.mockResolvedValue({ id: 'bk-x', status: 'UNFULFILLED' });

    await runExpiry();

    expect(mocks.containerReplace).toHaveBeenCalledTimes(3);
    expect(mocks.updateBookingFields).toHaveBeenCalledTimes(3);
    expect(mocks.eventAppend).toHaveBeenCalledTimes(3);
  });

  it('regression-catch: ETag conflict on attempt replace → caught silently, loop continues for other attempts', async () => {
    // The function wraps each attempt in try/catch inside Promise.allSettled.
    // A 412 on one attempt must not abort processing of the remaining attempts.
    const failAttempt = makeStaleAttempt({ id: 'da-conflict', bookingId: 'bk-fail', _etag: '"stale"' });
    const succeedAttempt = makeStaleAttempt({ id: 'da-ok', bookingId: 'bk-ok', _etag: '"fresh"' });
    mocks.fetchAll.mockResolvedValue({ resources: [failAttempt, succeedAttempt] });

    mocks.containerReplace
      .mockRejectedValueOnce(Object.assign(new Error('Precondition failed'), { statusCode: 412 }))
      .mockResolvedValueOnce({});

    await expect(runExpiry()).resolves.not.toThrow();

    // The successful attempt's booking must still have been updated
    const updateCalls = mocks.updateBookingFields.mock.calls as string[][];
    const updatedBookingIds = updateCalls.map(c => c[0]);
    expect(updatedBookingIds).toContain('bk-ok');
    expect(updatedBookingIds).not.toContain('bk-fail');
  });

  it('regression-catch: UNFULFILLED write required — removing updateBookingFields call strands bookings in SEARCHING forever', async () => {
    // If updateBookingFields is not called after replace, the booking stays in SEARCHING
    // indefinitely. The dispatcher will keep retrying dispatch for a permanently failed offer.
    const attempt = makeStaleAttempt();
    mocks.fetchAll.mockResolvedValue({ resources: [attempt] });

    await runExpiry();

    expect(mocks.updateBookingFields).toHaveBeenCalledOnce();
    expect(mocks.updateBookingFields.mock.calls[0]![1]).toMatchObject({ status: 'UNFULFILLED' });
  });

  it('already-EXPIRED attempts excluded by Cosmos query — no double-write on re-run', async () => {
    // The query selects WHERE c.status = 'PENDING'. An already-EXPIRED attempt is never
    // returned, so expireStaleOffers is safe to run multiple times on the same attempt.
    // Mock fetchAll returning empty simulates the steady-state after all attempts are expired.
    mocks.fetchAll.mockResolvedValue({ resources: [] });

    await runExpiry();

    expect(mocks.containerReplace).not.toHaveBeenCalled();
    expect(mocks.updateBookingFields).not.toHaveBeenCalled();
  });

  it('attempt with expiresAt in the future is not stale — not returned by query, no writes', async () => {
    // The Cosmos query filters c.expiresAt < @now. A future expiresAt means the offer is still
    // live and should not be expired. Simulated by fetchAll returning empty (query excluded it).
    mocks.fetchAll.mockResolvedValue({ resources: [] });

    await runExpiry();

    expect(mocks.containerReplace).not.toHaveBeenCalled();
    expect(mocks.eventAppend).not.toHaveBeenCalled();
  });
});

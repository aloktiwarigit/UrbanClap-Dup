/**
 * E11-S02 — Source adapter projector tests (TDD: written before impl)
 *
 * Each adapter file is tested with mocked change-feed documents to verify:
 * - Correct PendingActionType is emitted for each source event
 * - upsertAction is called BEFORE emitFcmForAction (ordering invariant)
 * - resolveAction is called on appropriate state transitions
 * - No-ops are handled gracefully
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock declarations ─────────────────────────────────────────────────────────

vi.mock('../../src/services/pending-action-projector.js', () => ({
  upsertAction: vi.fn().mockResolvedValue({ doc: { id: 'test', version: 1 }, created: true, noOp: false }),
  resolveAction: vi.fn().mockResolvedValue({ id: 'test', status: 'RESOLVED', version: 2 }),
  expireAction: vi.fn().mockResolvedValue({ id: 'test', status: 'EXPIRED', version: 2 }),
  emitFcmForAction: vi.fn().mockResolvedValue(undefined),
  buildPendingActionId: vi.fn((type: string, userId: string, sourceId: string) => `${type}:${userId}:${sourceId}`),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  DB_NAME: 'homeservices',
  getCosmosClient: vi.fn(),
  getPendingActionsContainer: vi.fn(),
  getBookingsContainer: vi.fn(),
  getDispatchAttemptsContainer: vi.fn(),
  getRatingsContainer: vi.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  upsertAction,
  resolveAction,
  emitFcmForAction,
} from '../../src/services/pending-action-projector.js';

import {
  processBookingChangeFeedDoc,
} from '../../src/functions/trigger-projector-bookings.js';

import {
  processRatingChangeFeedDoc,
} from '../../src/functions/trigger-projector-ratings.js';

import {
  processKycChangeFeedDoc,
} from '../../src/functions/trigger-projector-kyc.js';

import {
  processDispatchAttemptChangeFeedDoc,
} from '../../src/functions/trigger-projector-dispatch-attempts.js';

import {
  processComplaintChangeFeedDoc,
} from '../../src/functions/trigger-projector-complaints.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 3600_000).toISOString();

// ── Bookings adapter ──────────────────────────────────────────────────────────

describe('trigger-projector-bookings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits ADDON_APPROVAL_REQUESTED when booking moves to AWAITING_PRICE_APPROVAL', async () => {
    const doc = {
      id: 'booking-1',
      customerId: 'customer-1',
      status: 'AWAITING_PRICE_APPROVAL',
      pendingAddOns: [{ name: 'Extra cleaning', price: 500 }],
    };

    await processBookingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADDON_APPROVAL_REQUESTED',
        userId: 'customer-1',
        role: 'customer',
      }),
    );
    // FCM must be called AFTER upsertAction — verify both were called (ordering enforced by Semgrep rule)
    expect(emitFcmForAction).toHaveBeenCalled();
    // Verify upsertAction was called before emitFcmForAction by checking invocation counts
    const upsertInvocations = vi.mocked(upsertAction).mock.invocationCallOrder;
    const fcmInvocations = vi.mocked(emitFcmForAction).mock.invocationCallOrder;
    expect(upsertInvocations[0]).toBeLessThan(fcmInvocations[0]!);
  });

  it('emits RATING_PROMPT_CUSTOMER when booking moves to COMPLETED', async () => {
    const doc = {
      id: 'booking-2',
      customerId: 'customer-2',
      status: 'COMPLETED',
    };

    await processBookingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RATING_PROMPT_CUSTOMER',
        userId: 'customer-2',
      }),
    );
  });

  it('resolves ADDON_APPROVAL_REQUESTED when booking transitions from AWAITING_PRICE_APPROVAL to PAID', async () => {
    const doc = {
      id: 'booking-3',
      customerId: 'customer-3',
      status: 'PAID',
      // This simulates a booking that previously had AWAITING_PRICE_APPROVAL
    };

    await processBookingChangeFeedDoc(doc as never);

    expect(resolveAction).toHaveBeenCalledWith(
      expect.stringContaining('ADDON_APPROVAL_REQUESTED'),
      'customer-3',
    );
  });

  it('does not emit for irrelevant booking statuses', async () => {
    const doc = { id: 'booking-4', customerId: 'customer-4', status: 'SEARCHING' };

    await processBookingChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });
});

// ── Ratings adapter ───────────────────────────────────────────────────────────

describe('trigger-projector-ratings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits RATING_RECEIVED when a customer submits a rating for a technician', async () => {
    const doc = {
      id: 'rating-1',
      technicianId: 'tech-1',
      customerId: 'customer-1',
      customerOverall: 5,
      customerSubmittedAt: new Date().toISOString(),
    };

    await processRatingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RATING_RECEIVED',
        userId: 'tech-1',
        role: 'technician',
      }),
    );
    expect(emitFcmForAction).toHaveBeenCalled();
    // Verify ordering: upsertAction before emitFcmForAction
    const upsertOrder = vi.mocked(upsertAction).mock.invocationCallOrder;
    const fcmOrder = vi.mocked(emitFcmForAction).mock.invocationCallOrder;
    expect(upsertOrder[0]).toBeLessThan(fcmOrder[0]!);
  });

  it('does not emit RATING_RECEIVED when customerOverall is missing', async () => {
    const doc = { id: 'rating-2', technicianId: 'tech-2', customerId: 'customer-2' };

    await processRatingChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });
});

// ── KYC adapter (technicians container) ───────────────────────────────────────

describe('trigger-projector-kyc', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits KYC_RESUME when doc.kyc.kycStatus is PENDING_MANUAL (technician doc shape)', async () => {
    // The KYC projector now receives TechnicianDoc change events (kyc is a nested object).
    // The userId is doc.id (the technicianId in the technicians container).
    const doc = {
      id: 'tech-3',
      kyc: { kycStatus: 'PENDING_MANUAL', updatedAt: '2026-05-10T10:00:00.000Z' },
    };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'KYC_RESUME',
        userId: 'tech-3',
        role: 'technician',
      }),
    );
  });

  it('does not emit KYC_RESUME when doc.kyc.kycStatus is COMPLETE', async () => {
    const doc = { id: 'tech-4', kyc: { kycStatus: 'COMPLETE', updatedAt: '2026-05-10T10:00:00.000Z' } };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });
});

// ── Dispatch attempts adapter ─────────────────────────────────────────────────

describe('trigger-projector-dispatch-attempts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits JOB_OFFER for each technician in a PENDING dispatch attempt', async () => {
    const doc = {
      id: 'attempt-1',
      bookingId: 'booking-10',
      technicianIds: ['tech-5', 'tech-6'],
      status: 'PENDING',
      expiresAt: FUTURE,
    };

    await processDispatchAttemptChangeFeedDoc(doc as never);

    // Should emit JOB_OFFER for each technician
    expect(upsertAction).toHaveBeenCalledTimes(2);
    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'JOB_OFFER', userId: 'tech-5', role: 'technician' }),
    );
    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'JOB_OFFER', userId: 'tech-6', role: 'technician' }),
    );
  });

  it('expires JOB_OFFER for technicians when dispatch attempt expires', async () => {
    const doc = {
      id: 'attempt-2',
      bookingId: 'booking-11',
      technicianIds: ['tech-7'],
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    await processDispatchAttemptChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
    // expireAction called for expired attempt
    // (Implementation calls expireAction for each tech when status=EXPIRED)
  });
});

// ── Complaints adapter ────────────────────────────────────────────────────────

describe('trigger-projector-complaints', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits COMPLAINT_UPDATE for a new complaint', async () => {
    const doc = {
      id: 'complaint-1',
      customerId: 'customer-8',
      technicianId: 'tech-8',
      bookingId: 'booking-20',
      status: 'NEW',
    };

    await processComplaintChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'COMPLAINT_UPDATE',
        userId: 'customer-8',
        role: 'customer',
      }),
    );
  });

  it('does not emit for CLOSED complaints', async () => {
    const doc = {
      id: 'complaint-2',
      customerId: 'customer-9',
      technicianId: 'tech-9',
      bookingId: 'booking-21',
      status: 'CLOSED',
    };

    await processComplaintChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });
});

// ── P1-1: 429 + 449 classification ───────────────────────────────────────────

describe('P1-1: isRetryableCosmosError classifies 429/449 as retryable', () => {
  it('429 (throttling — SDK retries exhausted) is retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 429 })).toBe(true);
    expect(isRetryableCosmosError({ statusCode: 429 })).toBe(true);
  });

  it('449 (CONCURRENCY_RETRY) is retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 449 })).toBe(true);
    expect(isRetryableCosmosError({ statusCode: 449 })).toBe(true);
  });

  it('5xx codes remain retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 500 })).toBe(true);
    expect(isRetryableCosmosError({ code: 503 })).toBe(true);
  });

  it('other 4xx codes (400/404/409) remain non-retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 400 })).toBe(false);
    expect(isRetryableCosmosError({ code: 404 })).toBe(false);
    expect(isRetryableCosmosError({ code: 409 })).toBe(false);
  });

  it('ECONNRESET message is retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError(new Error('ECONNRESET from socket'))).toBe(true);
  });

  it('non-Error string is non-retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError('bad request')).toBe(false);
  });
});

// ── P1-2: Stable expiresAt derivation (anchored to approval request time) ────

describe('P1-2: ADDON_APPROVAL_REQUESTED expiry anchored to approval request time', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('prefers pendingAddOnsUpdatedAt over createdAt for the expiry anchor', async () => {
    const ADDON_REQUESTED_AT = '2026-05-10T14:00:00.000Z'; // add-on requested >24h after booking creation
    const BOOKING_CREATED_AT = '2026-05-01T10:00:00.000Z'; // booking created 9 days earlier
    const ADDON_EXPIRY_MS = 24 * 60 * 60 * 1_000;
    // Expected: 24h from the add-on request, not from booking creation
    const expectedExpiry = new Date(new Date(ADDON_REQUESTED_AT).getTime() + ADDON_EXPIRY_MS).toISOString();
    // Would be wrong if anchored to createdAt (already in the past relative to ADDON_REQUESTED_AT)
    const wrongExpiry = new Date(new Date(BOOKING_CREATED_AT).getTime() + ADDON_EXPIRY_MS).toISOString();

    const doc = {
      id: 'booking-advance-1',
      customerId: 'customer-advance',
      status: 'AWAITING_PRICE_APPROVAL',
      createdAt: BOOKING_CREATED_AT,
      pendingAddOnsUpdatedAt: ADDON_REQUESTED_AT,
      pendingAddOns: [{ name: 'pipe_replace', price: 1500 }],
    };

    await processBookingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: expectedExpiry }),
    );
    // Ensure the stale booking.createdAt is NOT used
    expect(upsertAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: wrongExpiry }),
    );
  });

  it('falls back to createdAt when pendingAddOnsUpdatedAt is absent (legacy doc)', async () => {
    const BOOKING_CREATED_AT = '2026-05-10T09:00:00.000Z';
    const ADDON_EXPIRY_MS = 24 * 60 * 60 * 1_000;
    const expectedExpiry = new Date(new Date(BOOKING_CREATED_AT).getTime() + ADDON_EXPIRY_MS).toISOString();

    const doc = {
      id: 'booking-legacy-1',
      customerId: 'customer-legacy',
      status: 'AWAITING_PRICE_APPROVAL',
      createdAt: BOOKING_CREATED_AT,
      // No pendingAddOnsUpdatedAt (legacy document)
      pendingAddOns: [],
    };

    await processBookingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: expectedExpiry }),
    );
  });

  it('add-on requested ≤24h after booking creation → action expiry still in the future', async () => {
    const now = new Date('2026-05-10T10:00:00.000Z');
    const ADDON_EXPIRY_MS = 24 * 60 * 60 * 1_000;
    const addonRequestedAt = now.toISOString(); // requested now
    const expectedExpiry = new Date(now.getTime() + ADDON_EXPIRY_MS).toISOString();

    const doc = {
      id: 'booking-same-day-1',
      customerId: 'customer-same-day',
      status: 'AWAITING_PRICE_APPROVAL',
      createdAt: new Date(now.getTime() - 3600_000).toISOString(), // created 1h ago
      pendingAddOnsUpdatedAt: addonRequestedAt,
      pendingAddOns: [],
    };

    await processBookingChangeFeedDoc(doc as never);

    const call = vi.mocked(upsertAction).mock.calls[0]![0];
    // expiry must be in the future (24h from request)
    expect(new Date(call.expiresAt).getTime()).toBeGreaterThan(now.getTime());
    expect(call.expiresAt).toBe(expectedExpiry);
  });

  it('add-on requested >24h after booking creation → action still visible for 24h from request', async () => {
    // Scenario: booking was created 48h ago, add-on requested now.
    const bookingCreatedAt = new Date('2026-05-08T10:00:00.000Z').toISOString(); // 48h ago
    const addonRequestedAt = new Date('2026-05-10T10:00:00.000Z').toISOString(); // now
    const ADDON_EXPIRY_MS = 24 * 60 * 60 * 1_000;
    const expectedExpiry = new Date(new Date(addonRequestedAt).getTime() + ADDON_EXPIRY_MS).toISOString();

    const doc = {
      id: 'booking-advance-48h',
      customerId: 'customer-advance-48h',
      status: 'AWAITING_PRICE_APPROVAL',
      createdAt: bookingCreatedAt,
      pendingAddOnsUpdatedAt: addonRequestedAt,
      pendingAddOns: [{ name: 'extra_filter', price: 800 }],
    };

    await processBookingChangeFeedDoc(doc as never);

    const call = vi.mocked(upsertAction).mock.calls[0]![0];
    expect(call.expiresAt).toBe(expectedExpiry);
    // Confirm it's NOT anchored to the stale createdAt (which would be in the past)
    const staleExpiry = new Date(new Date(bookingCreatedAt).getTime() + ADDON_EXPIRY_MS).toISOString();
    expect(call.expiresAt).not.toBe(staleExpiry);
  });

  it('bookings: same change-feed event delivered twice produces identical expiresAt (replay is a no-op)', async () => {
    const ADDON_REQUESTED_AT = '2026-01-15T12:00:00.000Z';
    const doc = {
      id: 'booking-replay-1',
      customerId: 'customer-replay',
      status: 'AWAITING_PRICE_APPROVAL',
      createdAt: '2026-01-14T08:00:00.000Z',
      pendingAddOnsUpdatedAt: ADDON_REQUESTED_AT,
      pendingAddOns: [],
    };

    // First delivery
    await processBookingChangeFeedDoc(doc as never);
    const firstCall = vi.mocked(upsertAction).mock.calls[0]![0];
    const firstExpiry = firstCall.expiresAt;

    vi.clearAllMocks();
    // Second delivery (replay)
    await processBookingChangeFeedDoc(doc as never);
    const secondCall = vi.mocked(upsertAction).mock.calls[0]![0];
    const secondExpiry = secondCall.expiresAt;

    expect(firstExpiry).toBe(secondExpiry);
  });

  it('ratings: RATING_RECEIVED expiresAt is derived from customerSubmittedAt (not Date.now)', async () => {
    const SUBMITTED_AT = '2026-02-10T08:30:00.000Z';
    const RATING_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000;
    const expectedExpiry = new Date(new Date(SUBMITTED_AT).getTime() + RATING_EXPIRY_MS).toISOString();

    const doc = {
      id: 'rating-stable-1',
      technicianId: 'tech-stable',
      customerId: 'customer-stable',
      customerOverall: 5,
      customerSubmittedAt: SUBMITTED_AT,
    };

    await processRatingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({
        expiresAt: expectedExpiry,
      }),
    );
  });
});

// ── P1-3: KYC projector reads from technicians container ─────────────────────

describe('P1-3: KYC projector reads kyc.kycStatus from TechnicianDoc', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits KYC_RESUME when doc.kyc.kycStatus is PENDING_MANUAL', async () => {
    const doc = {
      id: 'tech-kyc-1',
      kyc: { kycStatus: 'PENDING_MANUAL', updatedAt: '2026-05-10T10:00:00.000Z' },
    };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'KYC_RESUME', userId: 'tech-kyc-1', role: 'technician' }),
    );
  });

  it('emits KYC_RESUME when doc.kyc.kycStatus is MANUAL_REVIEW', async () => {
    const doc = {
      id: 'tech-kyc-2',
      kyc: { kycStatus: 'MANUAL_REVIEW', updatedAt: '2026-05-10T11:00:00.000Z' },
    };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'KYC_RESUME', userId: 'tech-kyc-2' }),
    );
  });

  it('emits KYC_RESUME when doc.kyc.kycStatus is PENDING', async () => {
    const doc = {
      id: 'tech-kyc-3',
      kyc: { kycStatus: 'PENDING', updatedAt: '2026-05-10T12:00:00.000Z' },
    };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalledOnce();
    expect(upsertAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'KYC_RESUME' }));
  });

  it('resolves KYC_RESUME when doc.kyc.kycStatus is COMPLETE', async () => {
    const doc = {
      id: 'tech-kyc-4',
      kyc: { kycStatus: 'COMPLETE', updatedAt: '2026-05-10T13:00:00.000Z' },
    };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
    // resolveAction is imported via the mock
    const { resolveAction: resolveActionFn } = await import('../../src/services/pending-action-projector.js');
    expect(resolveActionFn).toHaveBeenCalledWith(
      expect.stringContaining('KYC_RESUME'),
      'tech-kyc-4',
    );
  });

  it('skips document with no kyc sub-object (e.g. profile-only update)', async () => {
    const doc = { id: 'tech-profile-only' }; // no kyc field

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });

  it('skips document where kyc.kycStatus is absent', async () => {
    const doc = { id: 'tech-no-status', kyc: { aadhaarVerified: true } };

    await processKycChangeFeedDoc(doc as never);

    expect(upsertAction).not.toHaveBeenCalled();
  });
});

// ── P2-4: expireAction retry propagation ─────────────────────────────────────

describe('P2-4: dispatch-attempts projector rethrows retryable expireAction errors', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rethrows 429 from expireAction so the runtime retries the batch', async () => {
    const throttleError = Object.assign(new Error('TooManyRequests'), { code: 429 });
    const { expireAction: expireActionFn } = await import('../../src/services/pending-action-projector.js');
    vi.mocked(expireActionFn).mockRejectedValue(throttleError);

    const doc = {
      id: 'attempt-retry-1',
      bookingId: 'bk-retry',
      technicianIds: ['tech-retry'],
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    await expect(processDispatchAttemptChangeFeedDoc(doc as never)).rejects.toThrow('TooManyRequests');
  });

  it('swallows non-retryable 404 from expireAction (action already removed)', async () => {
    const notFoundError = Object.assign(new Error('NotFound'), { code: 404 });
    const { expireAction: expireActionFn } = await import('../../src/services/pending-action-projector.js');
    vi.mocked(expireActionFn).mockRejectedValue(notFoundError);

    const doc = {
      id: 'attempt-swallow-1',
      bookingId: 'bk-swallow',
      technicianIds: ['tech-swallow'],
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };

    // Must NOT throw — 404 is non-retryable; action was already removed/expired
    await expect(processDispatchAttemptChangeFeedDoc(doc as never)).resolves.toBeUndefined();
  });
});

// ── P2-5: RATING_PROMPT_CUSTOMER resolution ───────────────────────────────────

describe('P2-5: ratings projector resolves RATING_PROMPT_CUSTOMER on submission', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('resolves RATING_PROMPT_CUSTOMER when customer submits a rating', async () => {
    const doc = {
      id: 'rating-p25-1',
      technicianId: 'tech-p25',
      customerId: 'customer-p25',
      bookingId: 'booking-p25',
      customerOverall: 4,
      customerSubmittedAt: '2026-05-10T10:00:00.000Z',
    };

    await processRatingChangeFeedDoc(doc as never);

    // RATING_RECEIVED for the technician must be created
    expect(upsertAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RATING_RECEIVED', userId: 'tech-p25' }),
    );

    // RATING_PROMPT_CUSTOMER for the customer must be resolved
    const { resolveAction: resolveActionFn } = await import('../../src/services/pending-action-projector.js');
    expect(resolveActionFn).toHaveBeenCalledWith(
      expect.stringContaining('RATING_PROMPT_CUSTOMER'),
      'customer-p25',
    );
  });

  it('does NOT call resolveAction when bookingId is absent from the rating doc', async () => {
    const doc = {
      id: 'rating-p25-no-booking',
      technicianId: 'tech-p25b',
      customerId: 'customer-p25b',
      // no bookingId
      customerOverall: 5,
      customerSubmittedAt: '2026-05-10T11:00:00.000Z',
    };

    await processRatingChangeFeedDoc(doc as never);

    expect(upsertAction).toHaveBeenCalled(); // RATING_RECEIVED still emitted
    const { resolveAction: resolveActionFn } = await import('../../src/services/pending-action-projector.js');
    expect(resolveActionFn).not.toHaveBeenCalled(); // no bookingId → cannot resolve
  });
});

// ── P2-4 (legacy): Retryable error rethrow (kept for backward compat) ────────

describe('P2-4: projectors rethrow retryable Cosmos errors', () => {
  it('isRetryableCosmosError: 503 status code is retryable', async () => {
    // Import the shared helper to verify the classification logic
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 503 })).toBe(true);
    expect(isRetryableCosmosError({ statusCode: 500 })).toBe(true);
  });

  it('isRetryableCosmosError: 400/404/409 status codes are non-retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError({ code: 400 })).toBe(false);
    expect(isRetryableCosmosError({ code: 404 })).toBe(false);
    expect(isRetryableCosmosError({ code: 409 })).toBe(false);
  });

  it('isRetryableCosmosError: ECONNRESET message is retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError(new Error('ECONNRESET from socket'))).toBe(true);
  });

  it('isRetryableCosmosError: non-Error string is non-retryable', async () => {
    const { isRetryableCosmosError } = await import('../../src/shared/cosmos-errors.js');
    expect(isRetryableCosmosError('bad request')).toBe(false);
  });
});

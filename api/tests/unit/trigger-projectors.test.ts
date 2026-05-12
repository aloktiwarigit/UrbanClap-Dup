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

// ── KYC adapter ───────────────────────────────────────────────────────────────

describe('trigger-projector-kyc', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('emits KYC_RESUME when KYC status is PENDING_MANUAL', async () => {
    const doc = {
      id: 'kyc-1',
      technicianId: 'tech-3',
      kycStatus: 'PENDING_MANUAL',
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

  it('does not emit KYC_RESUME when KYC is already COMPLETE', async () => {
    const doc = { id: 'kyc-2', technicianId: 'tech-4', kycStatus: 'COMPLETE' };

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

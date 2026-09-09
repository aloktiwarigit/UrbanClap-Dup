import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/dispatch-attempt-repository.js', () => ({
  dispatchAttemptRepo: {
    getByBookingId: vi.fn(),
    acceptAttempt: vi.fn(),
    declineAttempt: vi.fn(),
  },
}));
vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: { append: vi.fn() },
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  updateBookingFields: vi.fn(),
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getDispatchAttemptsContainer: vi.fn(),
}));
vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { continueDispatchAfterOfferOutcome: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendBookingStatusUpdatePush: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/services/commission-hold.service.js', () => ({
  assertCanAccept: vi.fn(),
}));
vi.mock('../../src/services/auditLog.service.js', () => ({
  systemAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn(() => ({ send: vi.fn().mockResolvedValue('m') })),
}));

import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { dispatchAttemptRepo } from '../../src/cosmos/dispatch-attempt-repository.js';
import { bookingEventRepo } from '../../src/cosmos/booking-event-repository.js';
import { updateBookingFields } from '../../src/cosmos/booking-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';
import { assertCanAccept } from '../../src/services/commission-hold.service.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import { acceptJobOfferHandler } from '../../src/functions/job-offers.js';

const ctx = { error: vi.fn(), log: vi.fn() } as never;

function req(bookingId = 'bk-1') {
  const r = new HttpRequest({
    url: `http://localhost/api/v1/technicians/job-offers/${bookingId}/accept`,
    method: 'PATCH',
  });
  (r as unknown as { params: Record<string, string> }).params = { bookingId };
  return r;
}

const pendingAttempt = {
  id: 'att-1',
  bookingId: 'bk-1',
  technicianIds: ['tech-1'],
  sentAt: '2026-09-08T00:00:00.000Z',
  expiresAt: '2999-01-01T00:00:00.000Z',
  status: 'PENDING' as const,
};

// After declineAttempt runs, the attempt is EXPIRED (declineAttempt writes 'EXPIRED', not
// 'DECLINED' — dispatch-attempt-repository.ts:70). The handler re-reads the attempt before
// resetting the booking, so the mock has to model that transition rather than keep answering
// PENDING forever; an idealised mock here would hide the very guard it is meant to exercise.
function attemptGoesExpiredAfterDecline(): void {
  vi.mocked(dispatchAttemptRepo.getByBookingId)
    .mockReset()
    .mockResolvedValueOnce(pendingAttempt as never)
    .mockResolvedValue({ ...pendingAttempt, status: 'EXPIRED' } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' } as never);
  vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue(pendingAttempt as never);
  vi.mocked(dispatchAttemptRepo.declineAttempt).mockResolvedValue(pendingAttempt as never);
  vi.mocked(dispatchAttemptRepo.acceptAttempt).mockResolvedValue(pendingAttempt as never);
  vi.mocked(updateBookingFields).mockResolvedValue({
    id: 'bk-1', customerId: 'cust-1', status: 'ASSIGNED',
  } as never);
  vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockResolvedValue(true);
  vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'ALLOW' });
});

describe('acceptJobOfferHandler — commission hold gate', () => {
  it('ALLOW: accepts normally and assigns the booking', async () => {
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(200);
    expect(dispatchAttemptRepo.acceptAttempt).toHaveBeenCalledWith('att-1', 'bk-1');
  });

  it('BLOCKED: returns 403 COMMISSION_HOLD_BLOCKED with both figures', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({
      code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
  });

  it('BLOCKED: never marks the attempt accepted', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(dispatchAttemptRepo.acceptAttempt).not.toHaveBeenCalled();
    expect(updateBookingFields).not.toHaveBeenCalled();
  });

  it('BLOCKED: declines the attempt AND continues dispatch with the technician excluded', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(dispatchAttemptRepo.declineAttempt).toHaveBeenCalledWith('att-1', 'bk-1');
    expect(dispatcherService.continueDispatchAfterOfferOutcome).toHaveBeenCalledWith('bk-1', ['tech-1']);
  });

  it('BLOCKED: writes the booking event and the audit entry', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(bookingEventRepo.append).toHaveBeenCalledWith({
      event: 'TECH_ACCEPT_BLOCKED_BY_HOLD', technicianId: 'tech-1', bookingId: 'bk-1',
    });
    expect(systemAudit).toHaveBeenCalledWith(
      'JOB_ACCEPT_BLOCKED_BY_HOLD', 'booking', 'bk-1',
      { technicianId: 'tech-1', outstandingPaise: 620000, blockThresholdPaise: 500000 },
    );
  });

  it('BLOCKED: still returns 403 when continueDispatch throws', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
  });

  // declineAttempt has written the attempt to EXPIRED by the time continueDispatch runs (it writes
  // 'EXPIRED', not 'DECLINED'), so expireStaleOffers — which only matches PENDING — can never
  // reclaim this booking. Without the reset it sits in SEARCHING forever: retryAwaitingDispatch
  // takes only PAID/UNFULFILLED, and reconcileStaleBookings only logs. Resetting to PAID hands it
  // back to a lane that is actually swept (every 5 minutes).
  it('BLOCKED: a continueDispatch failure resets the booking to PAID so the retry lane reclaims it', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    attemptGoesExpiredAfterDecline();
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'PAID' });
    expect(res.status).toBe(403);
  });

  // continueDispatchAfterOfferOutcome can throw AFTER dispatchBookingToTechs has already created
  // the next attempt (it fails at the following updateBookingFields to SEARCHING), and a
  // concurrent expireStaleOffers may have re-dispatched too. Resetting to PAID then would let
  // retryAwaitingDispatch mint a SECOND attempt; getByBookingId returns only the newest, so
  // technician B — accepting the offer they were actually pushed — would get a spurious 403
  // FORBIDDEN. A live PENDING attempt means dispatch did move on, so there is nothing to reclaim.
  it('BLOCKED: does NOT reset the booking when a live PENDING attempt already exists', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatchAttemptRepo.getByBookingId)
      .mockReset()
      .mockResolvedValueOnce(pendingAttempt as never)
      .mockResolvedValue({
        ...pendingAttempt, id: 'att-2', technicianIds: ['tech-2'], status: 'PENDING',
      } as never);
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(updateBookingFields).not.toHaveBeenCalledWith('bk-1', { status: 'PAID' });
    expect(res.status).toBe(403);
  });

  // Best-effort: an unreadable attempt must not cost us the reset. The pre-guard behaviour (reset
  // unconditionally, worst case a spurious FORBIDDEN for one technician) still beats a permanent
  // stall in SEARCHING.
  it('BLOCKED: falls back to the reset when the guard read itself throws', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatchAttemptRepo.getByBookingId)
      .mockReset()
      .mockResolvedValueOnce(pendingAttempt as never)
      .mockRejectedValue(new Error('read failed'));
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(updateBookingFields).toHaveBeenCalledWith('bk-1', { status: 'PAID' });
    expect(res.status).toBe(403);
  });

  it('BLOCKED: still returns 403 when the booking reset itself also fails', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    attemptGoesExpiredAfterDecline();
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockRejectedValue(new Error('boom'));
    vi.mocked(updateBookingFields).mockRejectedValue(new Error('cosmos down'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({
      code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
  });

  // The safe direction, pinned explicitly: if the audit trail cannot be written we stop before
  // touching the attempt, so it stays PENDING and expireStaleOffers still reclaims the booking.
  // A reorder that moved the decline ahead of the audit writes would reintroduce the
  // unreclaimable-booking defect, and must fail here rather than only in the write-order test.
  it('BLOCKED: a failed booking-event write skips the decline and the dispatch hand-off', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(bookingEventRepo.append).mockRejectedValue(new Error('boom'));
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(dispatchAttemptRepo.declineAttempt).not.toHaveBeenCalled();
    expect(dispatcherService.continueDispatchAfterOfferOutcome).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
  });

  // The contract for this path is "always 403 with the dues payload". A side-effect that throws
  // must never become a 500 — that would tell the technician nothing about why they were refused,
  // and would hide a real block from ops.
  it.each([
    ['declineAttempt', () => vi.mocked(dispatchAttemptRepo.declineAttempt).mockRejectedValue(new Error('boom'))],
    ['bookingEventRepo.append', () => vi.mocked(bookingEventRepo.append).mockRejectedValue(new Error('boom'))],
    ['systemAudit', () => vi.mocked(systemAudit).mockRejectedValue(new Error('boom'))],
  ])('BLOCKED: still returns 403 with both figures when %s throws', async (_name, arrange) => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    arrange();
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({
      code: 'COMMISSION_HOLD_BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
  });

  // Event + audit are written before dispatch moves on, so the record of a block that really
  // happened cannot land after another technician already holds the offer.
  it('BLOCKED: writes the audit trail before handing the booking on', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    const order: string[] = [];
    vi.mocked(bookingEventRepo.append).mockImplementation(async () => { order.push('event'); });
    vi.mocked(systemAudit).mockImplementation(async () => { order.push('audit'); });
    vi.mocked(dispatchAttemptRepo.declineAttempt).mockImplementation(async () => {
      order.push('decline');
      return pendingAttempt as never;
    });
    vi.mocked(dispatcherService.continueDispatchAfterOfferOutcome).mockImplementation(async () => {
      order.push('continue');
      return true;
    });
    await acceptJobOfferHandler(req(), ctx);
    expect(order).toEqual(['event', 'audit', 'decline', 'continue']);
  });

  it('BLOCKED: still continues dispatch when declineAttempt returns null (already terminal)', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({
      decision: 'BLOCKED', outstandingPaise: 620000, blockThresholdPaise: 500000,
    });
    vi.mocked(dispatchAttemptRepo.declineAttempt).mockResolvedValue(null);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(dispatcherService.continueDispatchAfterOfferOutcome).toHaveBeenCalledWith('bk-1', ['tech-1']);
    expect(res.status).toBe(403);
  });

  it('INDETERMINATE: returns 503 and leaves the attempt PENDING', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'INDETERMINATE', reason: 'boom' });
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(503);
    expect(res.jsonBody).toEqual({ code: 'HOLD_CHECK_UNAVAILABLE' });
    expect(dispatchAttemptRepo.acceptAttempt).not.toHaveBeenCalled();
    expect(dispatchAttemptRepo.declineAttempt).not.toHaveBeenCalled();
    expect(dispatcherService.continueDispatchAfterOfferOutcome).not.toHaveBeenCalled();
  });

  it('INDETERMINATE: writes no audit entry (nothing was decided about the technician)', async () => {
    vi.mocked(assertCanAccept).mockResolvedValue({ decision: 'INDETERMINATE', reason: 'boom' });
    await acceptJobOfferHandler(req(), ctx);
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('the gate runs only after the ownership and expiry checks', async () => {
    vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue({
      ...pendingAttempt, technicianIds: ['someone-else'],
    } as never);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toEqual({ code: 'FORBIDDEN' });
    expect(assertCanAccept).not.toHaveBeenCalled();
  });

  it('an expired offer short-circuits before the gate', async () => {
    vi.mocked(dispatchAttemptRepo.getByBookingId).mockResolvedValue({
      ...pendingAttempt, expiresAt: '2000-01-01T00:00:00.000Z',
    } as never);
    const res = await acceptJobOfferHandler(req(), ctx);
    expect(res.status).toBe(410);
    expect(assertCanAccept).not.toHaveBeenCalled();
  });
});

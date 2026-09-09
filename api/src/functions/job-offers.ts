import { app, type HttpRequest, type HttpResponseInit, type InvocationContext, type Timer } from '@azure/functions';
import { getMessaging } from 'firebase-admin/messaging';
import * as Sentry from '@sentry/node';
import type { Resource } from '@azure/cosmos';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { updateBookingFields } from '../cosmos/booking-repository.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { sendBookingStatusUpdatePush } from '../services/fcm.service.js';
import { assertCanAccept } from '../services/commission-hold.service.js';
import { systemAudit } from '../services/auditLog.service.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export async function acceptJobOfferHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let technicianId: string;
  try {
    const { uid } = await verifyTechnicianToken(req);
    technicianId = uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  if (!attempt) {
    return { status: 404, jsonBody: { code: 'OFFER_NOT_FOUND' } };
  }
  if (attempt.status !== 'PENDING' || new Date(attempt.expiresAt) <= new Date()) {
    return { status: 410, jsonBody: { code: 'OFFER_EXPIRED' } };
  }
  if (!attempt.technicianIds.includes(technicianId)) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  // E21-S04 dues gate. Runs AFTER ownership/expiry so a stranger's request is rejected on
  // identity, not on someone else's balance — and BEFORE acceptAttempt so a blocked accept
  // never transiently marks the attempt ACCEPTED. The DECISION is always ALLOW while
  // holdEnforcementEnabled is off, but this is not a no-op: assertCanAccept still awaits a Cosmos
  // read to produce the accept-side shadow log, so every accept pays that latency from merge, not
  // from the flag flip. That awaited read is what widened the offer-expiry race handled below.
  const gate = await assertCanAccept(technicianId);

  if (gate.decision === 'INDETERMINATE') {
    // Fail closed: the accept does not succeed. But the attempt stays PENDING — the technician can
    // retry inside the 90s offer window, and expireStaleOffers (a ≤30s tick, matching PENDING
    // attempts past expiresAt) is the backstop once that window lapses.
    // Declining here would permanently exclude a possibly-solvent technician over an infra blip.
    ctx.error(`ACCEPT_HOLD_INDETERMINATE bookingId=${bookingId} technicianId=${technicianId} reason=${gate.reason}`);
    return { status: 503, jsonBody: { code: 'HOLD_CHECK_UNAVAILABLE' } };
  }

  if (gate.decision === 'BLOCKED') {
    // This path always answers 403 with the dues payload. Every write below is best-effort: a
    // failed side-effect must not surface as a 500, which would tell the technician nothing about
    // why they were refused and would hide a real block from ops.
    try {
      // Audit trail first, before dispatch hands the booking on. A block is a fact the moment it
      // is decided, and writing it here means the record can never land after another technician
      // already holds the offer.
      await bookingEventRepo.append({
        event: 'TECH_ACCEPT_BLOCKED_BY_HOLD',
        technicianId,
        bookingId,
      });
      await systemAudit('JOB_ACCEPT_BLOCKED_BY_HOLD', 'booking', bookingId, {
        technicianId,
        outstandingPaise: gate.outstandingPaise,
        blockThresholdPaise: gate.blockThresholdPaise,
      });

      // Attempts are single-technician: leaving this one PENDING would stall the booking for the
      // rest of the 90s offer window plus up to one ≤30s expireStaleOffers tick — around two
      // minutes. Decline it and walk straight to the next-nearest candidate.
      await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId);

      try {
        await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
      } catch (err: unknown) {
        Sentry.captureException(err);
        ctx.error('ACCEPT_HOLD_CONTINUE_DISPATCH_FAILED', err);
        // No timer can recover the booking from here. declineAttempt writes status EXPIRED, so
        // expireStaleOffers (which matches PENDING past expiresAt) will never see it again;
        // retryAwaitingDispatch takes only PAID/UNFULFILLED; reconcileStaleBookings only logs,
        // daily, after 24h. Left alone the booking sits in SEARCHING forever. Reset it into the
        // PAID lane — the same idiom dispatchBookingToTechs already uses when no technician is
        // available — so retryAwaitingDispatch reclaims it on its next 5-minute pass, with the
        // blocked technician excluded via getAttemptedTechnicianIds.
        //
        // Guarded on the attempt, NOT on booking status: continueDispatch can throw after
        // dispatchBookingToTechs has already created the next attempt (it fails at the following
        // write to SEARCHING), and a concurrent expireStaleOffers may have re-dispatched too. Both
        // interleavings leave the booking legitimately in SEARCHING, so a status check would not
        // catch them. Resetting to PAID there would let retryAwaitingDispatch mint a second
        // attempt; getByBookingId returns only the newest, so technician B would get a spurious
        // 403 FORBIDDEN on the offer they were actually pushed. A live PENDING attempt means
        // dispatch did move on and expireStaleOffers already covers the booking.
        try {
          let liveAttemptExists = false;
          try {
            const current = await dispatchAttemptRepo.getByBookingId(bookingId);
            liveAttemptExists = current?.status === 'PENDING';
          } catch (readErr: unknown) {
            // Unreadable: fall through to the reset. A spurious FORBIDDEN for one technician is
            // recoverable; a permanent stall in SEARCHING is not.
            ctx.error('ACCEPT_HOLD_RESET_GUARD_READ_FAILED', readErr);
          }
          if (liveAttemptExists) {
            ctx.log(`ACCEPT_HOLD_BOOKING_RESET_SKIPPED bookingId=${bookingId} reason=LIVE_PENDING_ATTEMPT`);
          } else {
            await updateBookingFields(bookingId, { status: 'PAID' });
          }
        } catch (resetErr: unknown) {
          Sentry.captureException(resetErr);
          ctx.error('ACCEPT_HOLD_BOOKING_RESET_FAILED', resetErr);
        }
      }
    } catch (err: unknown) {
      // A throw before the decline leaves the attempt PENDING, so the expiry timer still recovers
      // the booking. The technician's answer does not change either way.
      Sentry.captureException(err);
      ctx.error('ACCEPT_HOLD_BLOCK_SIDE_EFFECT_FAILED', err);
    }

    return {
      status: 403,
      jsonBody: {
        code: 'COMMISSION_HOLD_BLOCKED',
        outstandingPaise: gate.outstandingPaise,
        blockThresholdPaise: gate.blockThresholdPaise,
      },
    };
  }

  // Re-check expiry after the gate. `assertCanAccept` awaits a Cosmos round-trip, so the 90s offer
  // window can lapse between the check at line 34 and the write below; expireStaleOffers sweeps only
  // every 30s, so the attempt can still read PENDING and would otherwise be accepted late.
  // `expiresAt` is immutable on the attempt doc, so re-evaluating the value already in hand is
  // exact — a re-read would cost a round-trip and open a fresh window of its own. Placed AFTER the
  // BLOCKED/INDETERMINATE branches on purpose: a blocked technician must still be audited and their
  // attempt declined, whatever the clock says, so this must not pre-empt that path.
  if (new Date(attempt.expiresAt) <= new Date()) {
    return { status: 410, jsonBody: { code: 'OFFER_EXPIRED' } };
  }

  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
  if (!accepted) {
    // acceptAttempt now also refuses expired attempts, so a null can mean "expired in the sub-ms
    // between the recheck above and the repository's own read". Re-evaluating the same immutable
    // expiresAt distinguishes the two without an extra read: expired → 410, anything else (already
    // terminal, _etag conflict) → 409.
    if (new Date(attempt.expiresAt) <= new Date()) {
      return { status: 410, jsonBody: { code: 'OFFER_EXPIRED' } };
    }
    return { status: 409, jsonBody: { code: 'OFFER_ALREADY_TAKEN' } };
  }

  const updatedBooking = await updateBookingFields(bookingId, { status: 'ASSIGNED', technicianId });
  await bookingEventRepo.append({ event: 'TECH_ACCEPTED', technicianId, bookingId });
  if (updatedBooking) {
    await sendBookingStatusUpdatePush({
      customerId: updatedBooking.customerId,
      bookingId,
      status: updatedBooking.status,
    }).catch((err: unknown) => ctx.error('FCM BOOKING_STATUS_UPDATE failed', err));
  }

  const losingTechs = attempt.technicianIds.filter(id => id !== technicianId);
  void notifyLosingTechs(losingTechs, bookingId);

  return { status: 200, jsonBody: { bookingId, status: 'ASSIGNED' } };
}

export async function declineJobOfferHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  let technicianId: string;
  try {
    const { uid } = await verifyTechnicianToken(req);
    technicianId = uid;
  } catch {
    return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } };
  }

  const bookingId = (req as unknown as { params: { bookingId: string } }).params.bookingId;

  const attempt = await dispatchAttemptRepo.getByBookingId(bookingId);
  if (attempt?.technicianIds.includes(technicianId) && attempt.status !== 'ACCEPTED') {
    const terminalAttempt = attempt.status === 'PENDING'
      ? await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId)
      : attempt;
    if (terminalAttempt) {
      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
    }
  }

  await bookingEventRepo.append({ event: 'TECH_DECLINED', technicianId, bookingId });

  return { status: 200, jsonBody: { bookingId, status: 'DECLINED' } };
}

async function notifyLosingTechs(techIds: string[], bookingId: string): Promise<void> {
  const messaging = getMessaging();
  await Promise.allSettled(
    techIds.map(techId =>
      messaging.send({
        topic: `tech_${techId}`,
        data: { type: 'OFFER_CANCELLED', bookingId },
      })
    )
  );
}

async function expireStaleOffers(_timer: Timer, _ctx: InvocationContext): Promise<void> {
  const container = getDispatchAttemptsContainer();
  const { resources } = await container.items
    .query<DispatchAttemptDoc & Resource>({
      query: `SELECT * FROM c WHERE c.status = 'PENDING' AND c.expiresAt < @now`,
      parameters: [{ name: '@now', value: new Date().toISOString() }],
    })
    .fetchAll();

  await Promise.allSettled(
    resources.map(async attempt => {
      try {
        await container.item(attempt.id, attempt.id).replace(
          { ...attempt, status: 'EXPIRED' },
          { accessCondition: { type: 'IfMatch', condition: attempt._etag } },
        );
        await bookingEventRepo.append({ event: 'OFFER_EXPIRED', bookingId: attempt.bookingId });
        await dispatcherService.continueDispatchAfterOfferOutcome(attempt.bookingId, attempt.technicianIds);
      } catch {
        // 412 PreconditionFailed = concurrent process already updated this attempt; skip it
      }
    })
  );
}

app.http('acceptJobOffer', {
  route: 'v1/technicians/job-offers/{bookingId}/accept',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: acceptJobOfferHandler,
});

app.http('declineJobOffer', {
  route: 'v1/technicians/job-offers/{bookingId}/decline',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: declineJobOfferHandler,
});

app.timer('expireStaleOffers', {
  schedule: '*/30 * * * * *',
  handler: expireStaleOffers,
});

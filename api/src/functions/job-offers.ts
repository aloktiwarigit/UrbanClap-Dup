import { app, type HttpRequest, type HttpResponseInit, type InvocationContext, type Timer } from '@azure/functions';
import { getMessaging } from 'firebase-admin/messaging';
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
  // never transiently marks the attempt ACCEPTED. No-op while holdEnforcementEnabled is off.
  const gate = await assertCanAccept(technicianId);

  if (gate.decision === 'INDETERMINATE') {
    // Fail closed: the accept does not succeed. But the attempt stays PENDING — the technician
    // can retry inside the 90s offer window, and expireStaleOffers (every 30s) is the backstop.
    // Declining here would permanently exclude a possibly-solvent technician over an infra blip.
    ctx.error(`ACCEPT_HOLD_INDETERMINATE bookingId=${bookingId} technicianId=${technicianId} reason=${gate.reason}`);
    return { status: 503, jsonBody: { code: 'HOLD_CHECK_UNAVAILABLE' } };
  }

  if (gate.decision === 'BLOCKED') {
    // Attempts are single-technician: leaving this one PENDING would stall the booking for the
    // full 30s expiry cycle. Decline it and immediately walk to the next-nearest candidate.
    await dispatchAttemptRepo.declineAttempt(attempt.id, bookingId);
    try {
      await dispatcherService.continueDispatchAfterOfferOutcome(bookingId, attempt.technicianIds);
    } catch (err: unknown) {
      // The expiry timer will pick the booking up; the technician still gets a truthful 403.
      ctx.error('ACCEPT_HOLD_CONTINUE_DISPATCH_FAILED', err);
    }
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
    return {
      status: 403,
      jsonBody: {
        code: 'COMMISSION_HOLD_BLOCKED',
        outstandingPaise: gate.outstandingPaise,
        blockThresholdPaise: gate.blockThresholdPaise,
      },
    };
  }

  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
  if (!accepted) {
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

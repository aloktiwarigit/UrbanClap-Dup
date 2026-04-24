import { app, type HttpRequest, type HttpResponseInit, type InvocationContext, type Timer } from '@azure/functions';
import { getMessaging } from 'firebase-admin/messaging';
import type { Resource } from '@azure/cosmos';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { dispatchAttemptRepo } from '../cosmos/dispatch-attempt-repository.js';
import { bookingEventRepo } from '../cosmos/booking-event-repository.js';
import { updateBookingFields } from '../cosmos/booking-repository.js';
import { getDispatchAttemptsContainer } from '../cosmos/client.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';

export async function acceptJobOfferHandler(
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
  if (!attempt) {
    return { status: 404, jsonBody: { code: 'OFFER_NOT_FOUND' } };
  }
  if (attempt.status !== 'PENDING' || new Date(attempt.expiresAt) <= new Date()) {
    return { status: 410, jsonBody: { code: 'OFFER_EXPIRED' } };
  }
  if (!attempt.technicianIds.includes(technicianId)) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const accepted = await dispatchAttemptRepo.acceptAttempt(attempt.id, bookingId);
  if (!accepted) {
    return { status: 409, jsonBody: { code: 'OFFER_ALREADY_TAKEN' } };
  }

  await updateBookingFields(bookingId, { status: 'ASSIGNED', technicianId });
  await bookingEventRepo.append({ event: 'TECH_ACCEPTED', technicianId, bookingId });

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
        await container.item(attempt.id, attempt.bookingId).replace(
          { ...attempt, status: 'EXPIRED' },
          { accessCondition: { type: 'IfMatch', condition: attempt._etag } },
        );
        await updateBookingFields(attempt.bookingId, { status: 'UNFULFILLED' });
        await bookingEventRepo.append({ event: 'OFFER_EXPIRED', bookingId: attempt.bookingId });
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

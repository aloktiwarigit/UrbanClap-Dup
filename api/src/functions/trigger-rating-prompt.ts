import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { BookingDocSchema } from '../schemas/booking.js';
import { ratingRepo } from '../cosmos/rating-repository.js';
import {
  sendRatingPromptCustomerPush,
  sendRatingPromptTechnicianPush,
} from '../services/fcm.service.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

export async function dispatchRatingPrompt(
  bookingRaw: unknown,
  ctx: InvocationContext,
): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'CLOSED') return;
  const booking = parsed.data;
  if (!booking.technicianId) { ctx.log(`no technicianId on ${booking.id}`); return; }

  if (await ratingRepo.getByBookingId(booking.id)) {
    ctx.log(`rating doc exists for ${booking.id} — skipping prompt`);
    return;
  }

  const results = await Promise.allSettled([
    sendRatingPromptCustomerPush(booking.customerId, booking.id),
    sendRatingPromptTechnicianPush(booking.technicianId, booking.id),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') {
      Sentry.captureException(r.reason);
      ctx.log(`rating-prompt push failed for ${booking.id}: ${String(r.reason)}`);
    }
  }
}

app.cosmosDB('triggerRatingPrompt', {
  connection: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_rating_prompt_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (docs: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of docs) await dispatchRatingPrompt(doc, context);
  },
});

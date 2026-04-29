import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { HttpHandler, Timer } from '@azure/functions';
import { type InvocationContext, app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { getWebhookEventsContainer } from '../cosmos/client.js';

function isValidSignature(payload: string, provided: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
}

export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
  if (!secret) return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR' } };

  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const rawBody = await req.text();

  if (!isValidSignature(rawBody, signature, secret)) {
    return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };
  }

  let parsed;
  try {
    const json: unknown = JSON.parse(rawBody);
    const result = RazorpayWebhookPayloadSchema.safeParse(json);
    if (!result.success) {
      return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: result.error.issues } };
    }
    parsed = result.data;
  } catch {
    return { status: 400, jsonBody: { code: 'PARSE_ERROR' } };
  }

  // Event-ID replay defense — best-effort, never return 5xx from this block
  const eventId = req.headers.get('razorpay-event-id');
  if (eventId) {
    try {
      await getWebhookEventsContainer().items.create({
        id: eventId,
        bookingId: parsed.payload.payment.entity.order_id,
        processedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' && err !== null && 'code' in err &&
        (err as { code: number }).code === 409
      ) {
        return { status: 200, jsonBody: { received: true, deduplicated: true } };
      }
      Sentry.captureException(err);
    }
  }

  if (parsed.event !== 'payment.captured') {
    return { status: 200, jsonBody: { received: true } };
  }

  const orderId = parsed.payload.payment.entity.order_id;
  const paymentId = parsed.payload.payment.entity.id;

  const booking = await bookingRepo.getByPaymentOrderId(orderId);
  if (!booking) {
    return { status: 200, jsonBody: { received: true } };
  }

  if (booking.status === 'PAID') {
    return { status: 200, jsonBody: { received: true } };
  }

  const updated = await bookingRepo.markPaid(booking.id, paymentId);
  if (!updated) {
    return { status: 200, jsonBody: { received: true } };
  }

  const _ts = new Date().toISOString();
  void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'PAYMENT_CAPTURED', resourceType: 'booking', resourceId: booking.id, payload: { bookingId: booking.id, paymentId, orderId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);

  dispatcherService.triggerDispatch(booking.id).catch(() => {
    // fire-and-forget — dispatch failure does not fail the webhook ack
  });

  return { status: 200, jsonBody: { received: true } };
};

export async function reconcileStaleBookingsHandler(
  _myTimer: Timer,
  context: InvocationContext,
): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const stale = await bookingRepo.getStaleSearching(cutoff);
  for (const booking of stale) {
    context.log(`STALE_BOOKING bookingId=${booking.id} createdAt=${booking.createdAt}`);
  }
}

app.http('razorpayWebhook', {
  route: 'v1/webhooks/razorpay',
  methods: ['POST'],
  handler: razorpayWebhookHandler,
});

app.timer('reconcileStaleBookings', {
  schedule: '0 0 2 * * *',
  handler: reconcileStaleBookingsHandler,
});

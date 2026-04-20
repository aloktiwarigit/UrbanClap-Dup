import { createHmac } from 'node:crypto';
import type { HttpHandler, Timer } from '@azure/functions';
import { type InvocationContext, app } from '@azure/functions';
import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';

export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  const rawBody = await req.text();

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected !== signature) {
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

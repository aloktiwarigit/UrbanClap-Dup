import { randomUUID } from 'node:crypto';
import type { HttpHandler, Timer } from '@azure/functions';
import { type InvocationContext, app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { RazorpayWebhookPayloadSchema } from '../schemas/webhook.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { customerCreditLedgerRepo } from '../cosmos/customer-credit-ledger-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { getWebhookEventsContainer } from '../cosmos/client.js';
import { equalsHexHmac } from '../shared/timing-safe.js';
import { posthog } from '../observability/posthog.js';

export const razorpayWebhookHandler: HttpHandler = async (req, _ctx) => {
  const secret = process.env['RAZORPAY_WEBHOOK_SECRET'];
  if (!secret) return { status: 500, jsonBody: { code: 'CONFIGURATION_ERROR' } };

  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const rawBody = await req.text();

  if (!equalsHexHmac(secret, rawBody, signature)) {
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

  // Fast path: use bookingId embedded in Razorpay order notes for a cheap point-read.
  // Falls back to cross-partition scan for bookings created before this change.
  // [ ] Razorpay-live-gate: verify notes.bookingId survives order → payment → webhook round-trip
  const bookingIdFromNotes = parsed.payload.payment.entity.notes?.['bookingId'];
  let booking = null;
  if (bookingIdFromNotes) {
    booking = await bookingRepo.getById(bookingIdFromNotes);
  }
  if (!booking) {
    booking = await bookingRepo.getByPaymentOrderId(orderId);
  }

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

  // E13-S01 (P1-6): Apply deferred wallet credit AFTER payment confirmation.
  // The credit amount was stored on the booking doc at creation time to avoid the
  // "debit-before-payment" bug. Now that payment is confirmed, debit the ledger.
  // Non-fatal: if credit application fails, the booking is already PAID — log and continue.
  if (
    booking.pendingCreditAmountInPaise &&
    booking.pendingCreditAmountInPaise > 0 &&
    booking.pendingCreditIdempotencyKey
  ) {
    try {
      await customerCreditLedgerRepo.applyCredit(
        booking.customerId,
        booking.id,
        booking.pendingCreditAmountInPaise,
        booking.pendingCreditIdempotencyKey,
      );
      const _creditTs = new Date().toISOString();
      void appendAuditEntry({
        id: randomUUID(),
        adminId: 'system',
        role: 'system',
        action: 'WALLET_CREDIT_APPLIED_ON_PAYMENT',
        resourceType: 'booking',
        resourceId: booking.id,
        payload: {
          bookingId: booking.id,
          creditAmountInPaise: booking.pendingCreditAmountInPaise,
          idempotencyKey: booking.pendingCreditIdempotencyKey,
        },
        timestamp: _creditTs,
        partitionKey: _creditTs.slice(0, 7),
      }).catch(Sentry.captureException);
    } catch (creditErr: unknown) {
      // Credit application failure is non-fatal — booking is already PAID.
      // The pending credit fields remain on the booking doc for manual reconciliation.
      Sentry.captureException(creditErr);
      console.error('[razorpayWebhook] deferred credit application failed', {
        bookingId: booking.id,
        pendingCreditAmountInPaise: booking.pendingCreditAmountInPaise,
        idempotencyKey: booking.pendingCreditIdempotencyKey,
        err: creditErr,
      });
    }
  }

  try {
    posthog.capture({
      distinctId: booking.customerId,
      event: 'booking-paid',
      properties: {
        bookingId: booking.id,
        paymentId,
        orderId,
        creditAppliedInPaise: booking.pendingCreditAmountInPaise ?? 0,
      },
    });
  } catch { /* never break the webhook ack */ }

  // Event-ID replay defense written AFTER successful markPaid so a transient
  // Cosmos failure before this point does not permanently suppress Razorpay retries.
  // Best-effort: non-409 Cosmos errors are logged but never block the webhook ack.
  const eventId = req.headers.get('razorpay-event-id');
  if (eventId) {
    try {
      await getWebhookEventsContainer().items.create({
        id: eventId,
        bookingId: booking.id,
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

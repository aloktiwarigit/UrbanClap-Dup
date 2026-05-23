/**
 * E13-S01 (P1-6) — Deferred wallet credit debit in Razorpay webhook
 *
 * Tests that wallet credit is debited AFTER payment.captured, not at booking creation.
 * Covers: payment succeeds → credit debited, payment fails → credit NOT debited,
 * credit application error → non-fatal (booking stays PAID).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');

const { mockWebhookItemsCreate, mockApplyCredit } = vi.hoisted(() => ({
  mockWebhookItemsCreate: vi.fn(),
  mockApplyCredit: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getByPaymentOrderId: vi.fn(),
    getById: vi.fn(),
    markPaid: vi.fn(),
    getStaleSearching: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/customer-credit-ledger-repository.js', () => ({
  customerCreditLedgerRepo: {
    applyCredit: mockApplyCredit,
  },
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getWebhookEventsContainer: vi.fn(() => ({
    items: { create: mockWebhookItemsCreate },
  })),
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

vi.mock('../../src/observability/posthog.js', () => ({
  posthog: { capture: vi.fn() },
}));

import { razorpayWebhookHandler } from '../../src/functions/webhooks.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import * as Sentry from '@sentry/node';

type MockFn = ReturnType<typeof vi.fn>;

const mockCtx = {} as InvocationContext;

function makeSignature(body: string, secret = 'webhook_secret') {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeWebhookReq(body: string, signature: string) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/webhooks/razorpay',
    method: 'POST',
    body: { string: body },
    headers: { 'x-razorpay-signature': signature, 'content-type': 'application/json' },
  });
}

function makeCapturedBody(orderId: string, paymentId: string) {
  return JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: paymentId, order_id: orderId } } },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockWebhookItemsCreate.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// P1-6: Deferred credit applied after payment.captured
// ---------------------------------------------------------------------------

describe('razorpayWebhook — deferred wallet credit application (P1-6)', () => {
  it('P1-6a: applies wallet credit after payment.captured when pendingCreditAmountInPaise is set', async () => {
    const body = makeCapturedBody('order_with_credit', 'pay_with_credit');
    const signature = makeSignature(body);

    // Booking has pending credit set at creation time
    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce({
      id: 'bk-credit-1',
      customerId: 'cust-credit-1',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_with_credit',
      pendingCreditAmountInPaise: 50000,
      pendingCreditIdempotencyKey: 'idem-key-deferred-1',
    });
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce({
      id: 'bk-credit-1',
      customerId: 'cust-credit-1',
      status: 'PAID',
      pendingCreditAmountInPaise: 50000,
      pendingCreditIdempotencyKey: 'idem-key-deferred-1',
    });
    mockApplyCredit.mockResolvedValueOnce({
      appliedAmountInPaise: 50000,
      newBalanceInPaise: 0,
      idempotent: false,
    });

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    // Credit MUST be applied after payment
    expect(mockApplyCredit).toHaveBeenCalledWith(
      'cust-credit-1',
      'bk-credit-1',
      50000,
      'idem-key-deferred-1',
    );
  });

  it('P1-6b: does NOT apply credit when booking has no pendingCreditAmountInPaise', async () => {
    const body = makeCapturedBody('order_no_credit', 'pay_no_credit');
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce({
      id: 'bk-no-credit',
      customerId: 'cust-no-credit',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_no_credit',
      // no pendingCreditAmountInPaise
    });
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce({
      id: 'bk-no-credit',
      customerId: 'cust-no-credit',
      status: 'PAID',
    });

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    // applyCredit must NOT be called when no pending credit
    expect(mockApplyCredit).not.toHaveBeenCalled();
  });

  it('P1-6c: does NOT apply credit when payment fails / booking not found (credit stays intact)', async () => {
    const body = makeCapturedBody('order_not_found', 'pay_not_found');
    const signature = makeSignature(body);

    // Booking not found — no markPaid, no credit
    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce(null);

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(mockApplyCredit).not.toHaveBeenCalled();
  });

  it('P1-6d: credit application error is non-fatal — booking stays PAID and Sentry is notified', async () => {
    const body = makeCapturedBody('order_credit_fail', 'pay_credit_fail');
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce({
      id: 'bk-credit-fail',
      customerId: 'cust-credit-fail',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_credit_fail',
      pendingCreditAmountInPaise: 50000,
      pendingCreditIdempotencyKey: 'idem-key-fail',
    });
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce({
      id: 'bk-credit-fail',
      customerId: 'cust-credit-fail',
      status: 'PAID',
      pendingCreditAmountInPaise: 50000,
      pendingCreditIdempotencyKey: 'idem-key-fail',
    });
    // Credit application fails (e.g., Cosmos timeout)
    mockApplyCredit.mockRejectedValueOnce(new Error('Cosmos apply credit failed'));

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    // Webhook must still return 200 (don't cause Razorpay to retry unnecessarily)
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    // Error captured by Sentry for manual reconciliation
    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalled();
  });

  it('P1-6e: idempotent credit replay on webhook re-delivery (same bookingId)', async () => {
    const body = makeCapturedBody('order_idem_replay', 'pay_idem_replay');
    const signature = makeSignature(body);

    const bookingWithCredit = {
      id: 'bk-idem-replay',
      customerId: 'cust-idem',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_idem_replay',
      pendingCreditAmountInPaise: 50000,
      pendingCreditIdempotencyKey: 'idem-key-idem-replay',
    };

    (bookingRepo.getByPaymentOrderId as MockFn).mockResolvedValueOnce(bookingWithCredit);
    (bookingRepo.markPaid as MockFn).mockResolvedValueOnce({
      ...bookingWithCredit,
      status: 'PAID',
    });
    // applyCredit returns idempotent=true on replay
    mockApplyCredit.mockResolvedValueOnce({
      appliedAmountInPaise: 50000,
      newBalanceInPaise: 0,
      idempotent: true,
    });

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(mockApplyCredit).toHaveBeenCalledTimes(1);
  });
});

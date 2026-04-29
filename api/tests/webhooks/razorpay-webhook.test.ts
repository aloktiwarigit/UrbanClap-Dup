import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');

const { mockItemsCreate } = vi.hoisted(() => ({ mockItemsCreate: vi.fn() }));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getByPaymentOrderId: vi.fn(),
    markPaid: vi.fn(),
    getStaleSearching: vi.fn(),
  },
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: { triggerDispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({ appendAuditEntry: vi.fn().mockResolvedValue(undefined) }));

vi.mock('../../src/cosmos/client.js', () => ({
  getWebhookEventsContainer: vi.fn(() => ({
    items: { create: mockItemsCreate },
  })),
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

import { razorpayWebhookHandler, reconcileStaleBookingsHandler } from '../../src/functions/webhooks.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';
import { appendAuditEntry } from '../../src/cosmos/audit-log-repository.js';
import * as Sentry from '@sentry/node';

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

function makeWebhookReqWithEventId(body: string, signature: string, eventId: string) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/webhooks/razorpay',
    method: 'POST',
    body: { string: body },
    headers: {
      'x-razorpay-signature': signature,
      'content-type': 'application/json',
      'razorpay-event-id': eventId,
    },
  });
}

const mockCtx = {} as InvocationContext;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /v1/webhooks/razorpay', () => {
  it('returns 500 when RAZORPAY_WEBHOOK_SECRET is not configured', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', undefined as unknown as string);
    const body = JSON.stringify({ event: 'payment.captured' });
    const req = makeWebhookReq(body, 'any');
    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).toBe(500);
    expect((res.jsonBody as { code: string }).code).toBe('CONFIGURATION_ERROR');
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');
  });

  it('returns 400 on bad signature', async () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } } });
    const req = makeWebhookReq(body, 'bad_signature');
    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('SIGNATURE_INVALID');
  });

  it('returns 200 + transitions to PAID on valid payment.captured', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } },
    });
    const signature = makeSignature(body);
    const req = makeWebhookReq(body, signature);

    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-1',
      status: 'SEARCHING',
      paymentOrderId: 'order_456',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-1',
      status: 'PAID',
    });

    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-1', 'pay_123');
    expect(vi.mocked(dispatcherService.triggerDispatch)).toHaveBeenCalledWith('bk-1');
  });

  it('emits PAYMENT_CAPTURED audit entry after successful markPaid', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_audit', order_id: 'order_audit' } } },
    });
    const signature = makeSignature(body);
    const req = makeWebhookReq(body, signature);

    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-audit', status: 'SEARCHING', paymentOrderId: 'order_audit',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-audit', status: 'PAID' });

    await razorpayWebhookHandler(req, mockCtx);

    expect(vi.mocked(appendAuditEntry)).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYMENT_CAPTURED', resourceId: 'bk-audit' }),
    );
  });

  it('idempotency — second call on PAID booking returns 200, markPaid not called', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_123', order_id: 'order_456' } } },
    });
    const signature = makeSignature(body);
    const req = makeWebhookReq(body, signature);

    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-1',
      status: 'PAID',
      paymentOrderId: 'order_456',
    });

    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.markPaid)).not.toHaveBeenCalled();
  });

  // --- AC-1: Timing-safe signature (2 tests) ---

  it('valid signature validates correctly (timing-safe path)', async () => {
    const body = JSON.stringify({
      event: 'other.event',
      payload: { payment: { entity: { id: 'p', order_id: 'o' } } },
    });
    const signature = makeSignature(body);
    const req = makeWebhookReq(body, signature);
    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).not.toBe(400);
    expect((res.jsonBody as { code?: string }).code).not.toBe('SIGNATURE_INVALID');
  });

  it('same-length wrong signature is rejected without throwing (timing-safe path)', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'p', order_id: 'o' } } },
    });
    // A 64-char string of non-hex chars produces a 0-byte buffer when decoded with 'hex'.
    // Buffer lengths differ (32 vs 0) — must return 400 without throwing RangeError.
    const sameLen = 'z'.repeat(64);
    const req = makeWebhookReq(body, sameLen);
    const res = await razorpayWebhookHandler(req, mockCtx) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('SIGNATURE_INVALID');
  });

  // --- AC-2: Event-ID replay defense (4 tests) ---
  // Dedup write is placed AFTER successful markPaid so transient Cosmos failures
  // during business logic do not permanently suppress Razorpay retries.

  it('sequential retry after successful payment: PAID idempotency prevents second markPaid', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_dup', order_id: 'order_dup' } } },
    });
    const signature = makeSignature(body);

    // First delivery: markPaid succeeds → dedup record written
    mockItemsCreate.mockResolvedValueOnce({});
    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-dup', status: 'SEARCHING', paymentOrderId: 'order_dup',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-dup', status: 'PAID' });

    const res1 = await razorpayWebhookHandler(makeWebhookReqWithEventId(body, signature, 'evt_001'), mockCtx) as HttpResponseInit;
    expect(res1.status).toBe(200);
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledTimes(1);

    mockItemsCreate.mockClear();

    // Second delivery: booking is now PAID → PAID idempotency fires before dedup block
    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-dup', status: 'PAID', paymentOrderId: 'order_dup',
    });

    const res2 = await razorpayWebhookHandler(makeWebhookReqWithEventId(body, signature, 'evt_001'), mockCtx) as HttpResponseInit;
    expect(res2.status).toBe(200);
    expect((res2.jsonBody as { received: boolean }).received).toBe(true);
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledTimes(1); // not called again
    expect(mockItemsCreate).not.toHaveBeenCalled(); // dedup block not reached (PAID check fired first)
  });

  it('concurrent same event-id: 409 on dedup write returns 200 deduplicated', async () => {
    // Simulates concurrent delivery where first request already wrote the dedup record,
    // but this request still sees booking as SEARCHING (race window after markPaid).
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_conc', order_id: 'order_conc' } } },
    });
    const signature = makeSignature(body);

    mockItemsCreate.mockRejectedValueOnce({ code: 409 });
    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-conc', status: 'SEARCHING', paymentOrderId: 'order_conc',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-conc', status: 'PAID' });

    const res = await razorpayWebhookHandler(makeWebhookReqWithEventId(body, signature, 'evt_concurrent'), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { deduplicated?: boolean }).deduplicated).toBe(true);
  });

  it('no razorpay-event-id header processes normally without dedup', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_noid', order_id: 'order_noid' } } },
    });
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-noid', status: 'SEARCHING', paymentOrderId: 'order_noid',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-noid', status: 'PAID' });

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-noid', 'pay_noid');
    expect(mockItemsCreate).not.toHaveBeenCalled();
  });

  it('non-409 Cosmos error on dedup write is captured by Sentry and processing continues', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_s', order_id: 'order_s' } } },
    });
    const signature = makeSignature(body);

    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-s', status: 'SEARCHING', paymentOrderId: 'order_s',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-s', status: 'PAID' });
    mockItemsCreate.mockRejectedValueOnce(new Error('Cosmos unavailable'));

    const res = await razorpayWebhookHandler(makeWebhookReqWithEventId(body, signature, 'evt_sentry'), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalled();
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-s', 'pay_s');
  });

  // --- AC-3: Branch coverage gaps (4 tests) ---

  it('malformed JSON body returns 400 PARSE_ERROR', async () => {
    const body = 'not-json{{{';
    const signature = makeSignature(body);
    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('PARSE_ERROR');
  });

  it('unknown event type returns 200 without calling markPaid', async () => {
    const body = JSON.stringify({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'p', order_id: 'o' } } },
    });
    const signature = makeSignature(body);
    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    expect(vi.mocked(bookingRepo.markPaid)).not.toHaveBeenCalled();
  });

  it('orphan order returns 200 gracefully without calling markPaid', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'p', order_id: 'o_orphan' } } },
    });
    const signature = makeSignature(body);
    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
    expect(vi.mocked(bookingRepo.markPaid)).not.toHaveBeenCalled();
  });

  it('dispatch failure does not affect webhook 200 response (fire-and-forget)', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'p_df', order_id: 'o_df' } } },
    });
    const signature = makeSignature(body);
    (bookingRepo.getByPaymentOrderId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 'bk-df', status: 'SEARCHING', paymentOrderId: 'o_df',
    });
    (bookingRepo.markPaid as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-df', status: 'PAID' });
    vi.mocked(dispatcherService.triggerDispatch).mockReturnValueOnce(
      Promise.reject(new Error('dispatch failed')),
    );

    const res = await razorpayWebhookHandler(makeWebhookReq(body, signature), mockCtx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { received: boolean }).received).toBe(true);
  });
});

describe('reconcileStaleBookingsHandler', () => {
  it('logs STALE_BOOKING for old SEARCHING bookings', async () => {
    (bookingRepo.getStaleSearching as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 'bk-stale', createdAt: '2026-01-01T00:00:00.000Z' },
    ]);

    const logSpy = vi.fn();
    const fakeCtx = { log: logSpy } as unknown as InvocationContext;

    await reconcileStaleBookingsHandler({} as never, fakeCtx);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('STALE_BOOKING bookingId=bk-stale'),
    );
  });
});

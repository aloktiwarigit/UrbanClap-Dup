import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');

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

import { razorpayWebhookHandler, reconcileStaleBookingsHandler } from '../../src/functions/webhooks.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';

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

const mockCtx = {} as InvocationContext;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /v1/webhooks/razorpay', () => {
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
    expect(bookingRepo.markPaid).toHaveBeenCalledWith('bk-1', 'pay_123');
    expect(dispatcherService.triggerDispatch).toHaveBeenCalledWith('bk-1');
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
    expect(bookingRepo.markPaid).not.toHaveBeenCalled();
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

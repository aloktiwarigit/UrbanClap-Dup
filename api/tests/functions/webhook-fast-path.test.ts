/**
 * E12-S03 — Sub-task B: paymentOrderId fast path via Razorpay notes
 *
 * Verifies that:
 * 1. When notes.bookingId is present, getById (point-read) is called and
 *    getByPaymentOrderId is NOT called.
 * 2. When notes.bookingId is absent (old bookings), getByPaymentOrderId
 *    fallback is called.
 * 3. When getById returns null (data inconsistency), the fallback fires.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret');

const { mockItemsCreate } = vi.hoisted(() => ({ mockItemsCreate: vi.fn() }));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
    getByPaymentOrderId: vi.fn(),
    markPaid: vi.fn(),
    getStaleSearching: vi.fn(),
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
    items: { create: mockItemsCreate },
  })),
}));

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { razorpayWebhookHandler } from '../../src/functions/webhooks.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';

function makeSignature(body: string, secret = 'webhook_secret') {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function makeReq(body: string, signature: string) {
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
  mockItemsCreate.mockResolvedValue({});
});

describe('webhook fast path — notes.bookingId present', () => {
  it('calls getById with the notes.bookingId and skips getByPaymentOrderId', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_fast',
            order_id: 'order_fast',
            notes: { bookingId: 'bk-from-notes' },
          },
        },
      },
    });
    const signature = makeSignature(body);

    vi.mocked(bookingRepo.getById).mockResolvedValueOnce({
      id: 'bk-from-notes',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_fast',
    } as never);
    vi.mocked(bookingRepo.markPaid).mockResolvedValueOnce({
      id: 'bk-from-notes',
      status: 'PAID',
    } as never);

    const res = (await razorpayWebhookHandler(makeReq(body, signature), mockCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.getById)).toHaveBeenCalledWith('bk-from-notes');
    expect(vi.mocked(bookingRepo.getByPaymentOrderId)).not.toHaveBeenCalled();
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-from-notes', 'pay_fast');
  });

  it('falls back to getByPaymentOrderId when getById returns null (stale data)', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_fb',
            order_id: 'order_fb',
            notes: { bookingId: 'bk-missing' },
          },
        },
      },
    });
    const signature = makeSignature(body);

    vi.mocked(bookingRepo.getById).mockResolvedValueOnce(null);
    vi.mocked(bookingRepo.getByPaymentOrderId).mockResolvedValueOnce({
      id: 'bk-fb',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_fb',
    } as never);
    vi.mocked(bookingRepo.markPaid).mockResolvedValueOnce({
      id: 'bk-fb',
      status: 'PAID',
    } as never);

    const res = (await razorpayWebhookHandler(makeReq(body, signature), mockCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.getById)).toHaveBeenCalledWith('bk-missing');
    expect(vi.mocked(bookingRepo.getByPaymentOrderId)).toHaveBeenCalledWith('order_fb');
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-fb', 'pay_fb');
  });
});

describe('webhook fast path — notes.bookingId absent (old bookings fallback)', () => {
  it('calls getByPaymentOrderId when notes field is absent', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_old',
            order_id: 'order_old',
          },
        },
      },
    });
    const signature = makeSignature(body);

    vi.mocked(bookingRepo.getByPaymentOrderId).mockResolvedValueOnce({
      id: 'bk-old',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_old',
    } as never);
    vi.mocked(bookingRepo.markPaid).mockResolvedValueOnce({
      id: 'bk-old',
      status: 'PAID',
    } as never);

    const res = (await razorpayWebhookHandler(makeReq(body, signature), mockCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.getById)).not.toHaveBeenCalled();
    expect(vi.mocked(bookingRepo.getByPaymentOrderId)).toHaveBeenCalledWith('order_old');
    expect(vi.mocked(bookingRepo.markPaid)).toHaveBeenCalledWith('bk-old', 'pay_old');
  });

  it('calls getByPaymentOrderId when notes exists but bookingId is empty', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_empty',
            order_id: 'order_empty',
            notes: { bookingId: '' },
          },
        },
      },
    });
    const signature = makeSignature(body);

    vi.mocked(bookingRepo.getByPaymentOrderId).mockResolvedValueOnce({
      id: 'bk-empty',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_empty',
    } as never);
    vi.mocked(bookingRepo.markPaid).mockResolvedValueOnce({
      id: 'bk-empty',
      status: 'PAID',
    } as never);

    const res = (await razorpayWebhookHandler(makeReq(body, signature), mockCtx)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(vi.mocked(bookingRepo.getById)).not.toHaveBeenCalled();
    expect(vi.mocked(bookingRepo.getByPaymentOrderId)).toHaveBeenCalledWith('order_empty');
  });
});

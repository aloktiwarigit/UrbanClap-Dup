import { describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: Function) => (req: HttpRequest, ctx: unknown) =>
    handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn().mockResolvedValue({
      id: 'bk-1', customerId: 'cust-1', status: 'PENDING_PAYMENT', paymentOrderId: 'order_1',
    }),
    confirmPayment: vi.fn().mockResolvedValue({ id: 'bk-1', status: 'SEARCHING' }),
    createPending: vi.fn(),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

import { confirmBookingHandler } from '../../src/functions/bookings.js';

function confirmReq(id: string, body: unknown) {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/bookings/${id}/confirm`, method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
  Object.assign(req, { params: { id } });
  return req;
}

describe('POST /v1/bookings/:id/confirm', () => {
  it('returns 200 with SEARCHING status on valid signature', async () => {
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'pay_1', razorpayOrderId: 'order_1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('SEARCHING');
  });

  it('returns 400 on invalid signature', async () => {
    const { verifyPaymentSignature } = await import('../../src/services/razorpay.service.js');
    (verifyPaymentSignature as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'bad' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('SIGNATURE_INVALID');
  });

  it('returns 404 when booking not found', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await confirmBookingHandler(
      confirmReq('missing', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 403 when customerId does not match booking', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'bk-1', customerId: 'other-customer', status: 'PENDING_PAYMENT' });
    const res = await confirmBookingHandler(
      confirmReq('bk-1', { razorpayPaymentId: 'p1', razorpayOrderId: 'o1', razorpaySignature: 'sig' }),
      {} as never,
    ) as HttpResponseInit;
    expect(res.status).toBe(403);
  });
});

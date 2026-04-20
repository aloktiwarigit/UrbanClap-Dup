import { describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: Function) => (req: HttpRequest, ctx: unknown) =>
    handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    createPending: vi.fn().mockResolvedValue({
      id: 'bk-1', customerId: 'cust-1', serviceId: 'svc-1', categoryId: 'cat-1',
      slotDate: '2026-05-01', slotWindow: '10:00-12:00',
      addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
      status: 'PENDING_PAYMENT', paymentOrderId: 'order_xyz',
      paymentId: null, paymentSignature: null, amount: 59900,
      createdAt: '2026-04-20T00:00:00.000Z',
    }),
    getById: vi.fn(),
    confirmPayment: vi.fn(),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({ id: 'order_xyz', amount: 59900, currency: 'INR' }),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({ id: 'svc-1', basePrice: 59900, isActive: true }),
  },
}));

import { createBookingHandler } from '../../src/functions/bookings.js';

function postReq(body: unknown) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings', method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /v1/bookings', () => {
  it('returns 201 with bookingId, razorpayOrderId, amount', async () => {
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { bookingId: string; razorpayOrderId: string; amount: number };
    expect(b.bookingId).toBe('bk-1');
    expect(b.razorpayOrderId).toBe('order_xyz');
    expect(b.amount).toBe(59900);
  });

  it('returns 422 on invalid body', async () => {
    const res = (await createBookingHandler(postReq({ serviceId: '' }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(422);
  });

  it('returns 404 when service not found', async () => {
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    (catalogueRepo.getServiceByIdCrossPartition as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = (await createBookingHandler(postReq({
      serviceId: 'missing', categoryId: 'c1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: 'addr', addressLatLng: { lat: 0, lng: 0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(404);
  });
});

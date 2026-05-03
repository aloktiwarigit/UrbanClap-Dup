import { beforeEach, describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: unknown) => handler(req, ctx, { customerId: 'cust-1' }),
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
    markPaid: vi.fn().mockResolvedValue({
      id: 'bk-1', customerId: 'cust-1', serviceId: 'svc-1', categoryId: 'cat-1',
      slotDate: '2026-05-01', slotWindow: '10:00-12:00',
      addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
      status: 'PAID', paymentOrderId: 'manual_1',
      paymentId: 'manual_payment_not_configured', paymentSignature: null, amount: 59900,
      createdAt: '2026-04-20T00:00:00.000Z',
    }),
  },
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn().mockResolvedValue({ id: 'order_xyz', amount: 59900, currency: 'INR' }),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/services/dispatcher.service.js', () => ({
  dispatcherService: {
    triggerDispatch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    getServiceByIdCrossPartition: vi.fn().mockResolvedValue({ id: 'svc-1', basePrice: 59900, isActive: true }),
  },
}));

import { createBookingHandler } from '../../src/functions/bookings.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { createRazorpayOrder } from '../../src/services/razorpay.service.js';
import { dispatcherService } from '../../src/services/dispatcher.service.js';

function useValidRazorpayEnv() {
  process.env.RAZORPAY_KEY_ID = 'rzp_test';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret';
}

function postReq(body: unknown) {
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings', method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /v1/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useValidRazorpayEnv();
  });

  it('returns 201 with bookingId, razorpayOrderId, amount', async () => {
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { bookingId: string; razorpayOrderId: string; amount: number; requiresPayment: boolean; paymentMethod: string };
    expect(b.bookingId).toBe('bk-1');
    expect(b.razorpayOrderId).toBe('order_xyz');
    expect(b.amount).toBe(59900);
    expect(b.requiresPayment).toBe(true);
    expect(b.paymentMethod).toBe('RAZORPAY');
  });

  it('creates a cash-on-service booking without creating a Razorpay order', async () => {
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
      paymentMethod: 'CASH_ON_SERVICE',
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { bookingId: string; razorpayOrderId: string; amount: number; requiresPayment: boolean; paymentMethod: string };
    expect(b.bookingId).toBe('bk-1');
    expect(b.razorpayOrderId).toMatch(/^cash_/);
    expect(b.amount).toBe(59900);
    expect(b.requiresPayment).toBe(false);
    expect(b.paymentMethod).toBe('CASH_ON_SERVICE');
    expect(createRazorpayOrder).not.toHaveBeenCalled();
    expect(bookingRepo.createPending).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'CASH_ON_SERVICE' }),
      'cust-1',
      expect.stringMatching(/^cash_/),
      59900,
    );
    expect(bookingRepo.markPaid).toHaveBeenCalledWith('bk-1', 'cash_on_service_pending');
    expect(dispatcherService.triggerDispatch).toHaveBeenCalledWith('bk-1');
  });

  it('creates a manual-payment booking when Razorpay is not configured', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { bookingId: string; razorpayOrderId: string; amount: number; requiresPayment: boolean; paymentMethod: string };
    expect(b.bookingId).toBe('bk-1');
    expect(b.razorpayOrderId).toMatch(/^manual_/);
    expect(b.amount).toBe(59900);
    expect(b.requiresPayment).toBe(false);
    expect(b.paymentMethod).toBe('CASH_ON_SERVICE');
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });

  it('creates a manual-payment booking when Razorpay uses deployed placeholder values', async () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
    process.env.RAZORPAY_KEY_SECRET = 'placeholder';
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(201);
    const b = res.jsonBody as { razorpayOrderId: string; requiresPayment: boolean; paymentMethod: string };
    expect(b.razorpayOrderId).toMatch(/^manual_/);
    expect(b.requiresPayment).toBe(false);
    expect(b.paymentMethod).toBe('CASH_ON_SERVICE');
    expect(createRazorpayOrder).not.toHaveBeenCalled();
  });

  it('returns a structured payment error when Razorpay order creation fails', async () => {
    (createRazorpayOrder as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      statusCode: 401,
      error: { code: 'BAD_REQUEST_ERROR', description: 'Authentication failed' },
    });
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
    }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(502);
    expect(res.jsonBody).toEqual({
      code: 'PAYMENT_ORDER_FAILED',
      message: 'Could not start payment. Please try again.',
    });
  });

  it('returns 422 on invalid body', async () => {
    const res = (await createBookingHandler(postReq({ serviceId: '' }), {} as never)) as HttpResponseInit;
    expect(res.status).toBe(422);
  });

  it('returns 422 on unsupported payment method', async () => {
    const res = (await createBookingHandler(postReq({
      serviceId: 'svc-1', categoryId: 'cat-1', slotDate: '2026-05-01',
      slotWindow: '10:00-12:00', addressText: '123 St', addressLatLng: { lat: 12.0, lng: 77.0 },
      paymentMethod: 'PAY_LATER_UNKNOWN',
    }), {} as never)) as HttpResponseInit;
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

/**
 * E13-S01 branch-coverage gap closure
 *
 * Covers the residual uncovered branches that kept the suite at 79.99%:
 *   bookings.ts  – verifyTechnicianToken throw → 401
 *   bookings.ts  – sendPriceApprovalPush throw → 200 (non-fatal)
 *   bookings.ts  – confirmPayment returns null → 409
 */

import { describe, it, expect, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

// --- shared mocks -----------------------------------------------------------

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
    requestAddOn: vi.fn(),
    confirmPayment: vi.fn(),
    createPending: vi.fn(),
  },
}));

vi.mock('../../src/services/fcm.service.js', () => ({
  sendPriceApprovalPush: vi.fn(),
  sendTechnicianBookingStatusUpdatePush: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (h: (req: HttpRequest, ctx: unknown, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: unknown) => h(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/services/razorpay.service.js', () => ({
  createRazorpayOrder: vi.fn(),
  verifyPaymentSignature: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

import { requestAddonHandler, confirmBookingHandler } from '../../src/functions/bookings.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { sendPriceApprovalPush } from '../../src/services/fcm.service.js';

type MockFn = ReturnType<typeof vi.fn>;

function addonReq(id: string, body: unknown) {
  const r = new HttpRequest({
    url: `http://localhost/api/v1/bookings/${id}/request-addon`,
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
  });
  Object.assign(r, { params: { id } });
  return r;
}

function confirmReq(id: string, body: unknown) {
  const r = new HttpRequest({
    url: `http://localhost/api/v1/bookings/${id}/confirm`,
    method: 'POST',
    body: { string: JSON.stringify(body) },
    headers: { 'content-type': 'application/json' },
  });
  Object.assign(r, { params: { id } });
  return r;
}

const addonBody = { name: 'Gas refill', price: 120000, triggerDescription: 'Low pressure' };
const booking = { id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'IN_PROGRESS', amount: 59900 };

// ---------------------------------------------------------------------------
// bookings.ts line 479: catch { return 401 } when verifyTechnicianToken throws
// ---------------------------------------------------------------------------
describe('requestAddonHandler — 401 on invalid technician token', () => {
  it('returns 401 when verifyTechnicianToken rejects', async () => {
    (verifyTechnicianToken as MockFn).mockRejectedValueOnce(new Error('bad token'));

    const res = await requestAddonHandler(
      addonReq('bk-1', addonBody),
      {} as never,
    ) as HttpResponseInit;

    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// bookings.ts lines 492–494: catch when sendPriceApprovalPush throws
// The handler must still return 200 — FCM failure is non-fatal.
// ---------------------------------------------------------------------------
describe('requestAddonHandler — 200 when sendPriceApprovalPush throws (non-fatal FCM)', () => {
  it('returns 200 even if FCM push throws', async () => {
    (verifyTechnicianToken as MockFn).mockResolvedValueOnce({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValueOnce(booking);
    (bookingRepo.requestAddOn as MockFn).mockResolvedValueOnce({
      ...booking,
      status: 'AWAITING_PRICE_APPROVAL',
    });
    (sendPriceApprovalPush as MockFn).mockRejectedValueOnce(new Error('FCM unavailable'));

    const res = await requestAddonHandler(
      addonReq('bk-1', addonBody),
      {} as never,
    ) as HttpResponseInit;

    // Non-fatal: booking is already AWAITING_PRICE_APPROVAL; 200 must be returned.
    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('AWAITING_PRICE_APPROVAL');
  });
});

// ---------------------------------------------------------------------------
// bookings.ts line 406: if (!confirmed) → 409 when confirmPayment returns null
// ---------------------------------------------------------------------------
describe('confirmBookingHandler — 409 when confirmPayment returns null (concurrent lock)', () => {
  it('returns 409 BOOKING_ALREADY_PROCESSED when confirmPayment returns null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValueOnce({
      id: 'bk-1',
      customerId: 'cust-1',
      status: 'PENDING_PAYMENT',
      paymentOrderId: 'order_1',
    });
    (bookingRepo.confirmPayment as MockFn).mockResolvedValueOnce(null);

    const res = await confirmBookingHandler(
      confirmReq('bk-1', {
        razorpayPaymentId: 'pay_1',
        razorpayOrderId: 'order_1',
        razorpaySignature: 'sig',
      }),
      {} as never,
    ) as HttpResponseInit;

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_ALREADY_PROCESSED');
  });
});

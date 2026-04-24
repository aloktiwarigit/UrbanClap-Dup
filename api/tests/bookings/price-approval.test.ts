import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_test');
vi.stubEnv('RAZORPAY_KEY_SECRET', 'rzp_secret');

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (h: Function) => (req: HttpRequest, ctx: unknown) =>
    h(req, ctx, { customerId: 'cust-1' }),
}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn().mockResolvedValue({ uid: 'tech-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
    requestAddOn: vi.fn(),
    applyAddOnDecisions: vi.fn(),
  },
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendPriceApprovalPush: vi.fn().mockResolvedValue(undefined),
}));

import { getBookingHandler, requestAddonHandler, approveFinalPriceHandler } from '../../src/functions/bookings.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';

type MockFn = ReturnType<typeof vi.fn>;

const booking = { id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'IN_PROGRESS', amount: 59900, pendingAddOns: [] };

function req(method: string, id: string, suffix: string, body?: unknown) {
  const url = `http://localhost/api/v1/bookings/${id}${suffix}`;
  const r = new HttpRequest({
    url, method,
    ...(body !== undefined ? { body: { string: JSON.stringify(body) } } : {}),
    headers: { 'content-type': 'application/json', authorization: 'Bearer tok' },
  });
  Object.assign(r, { params: { id } });
  return r;
}

describe('GET /v1/bookings/{id}', () => {
  it('returns 200 with pendingAddOns', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue(booking);
    const res: any = await getBookingHandler(req('GET', 'bk-1', ''), {} as any);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).bookingId).toBe('bk-1');
  });
  it('returns 403 when customerId mismatch', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({ ...booking, customerId: 'other' });
    const res: any = await getBookingHandler(req('GET', 'bk-1', ''), {} as any);
    expect(res.status).toBe(403);
  });
});

describe('POST /v1/bookings/{id}/request-addon', () => {
  const body = { name: 'Gas refill', price: 120000, triggerDescription: 'Low pressure' };
  it('returns 200 and AWAITING_PRICE_APPROVAL', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue(booking);
    (bookingRepo.requestAddOn as MockFn).mockResolvedValue({ ...booking, status: 'AWAITING_PRICE_APPROVAL' });
    const res: any = await requestAddonHandler(req('POST', 'bk-1', '/request-addon', body), {} as any);
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).status).toBe('AWAITING_PRICE_APPROVAL');
  });
  it('returns 403 when tech not assigned', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue({ ...booking, technicianId: 'other' });
    const res: any = await requestAddonHandler(req('POST', 'bk-1', '/request-addon', body), {} as any);
    expect(res.status).toBe(403);
  });
  it('returns 409 when requestAddOn returns null', async () => {
    (bookingRepo.getById as MockFn).mockResolvedValue(booking);
    (bookingRepo.requestAddOn as MockFn).mockResolvedValue(null);
    const res: any = await requestAddonHandler(req('POST', 'bk-1', '/request-addon', body), {} as any);
    expect(res.status).toBe(409);
  });
});

describe('POST /v1/bookings/{id}/approve-final-price', () => {
  it('returns 200 with finalAmount', async () => {
    (bookingRepo.applyAddOnDecisions as MockFn).mockResolvedValue({ id: 'bk-1', status: 'IN_PROGRESS', finalAmount: 179900 });
    const res: any = await approveFinalPriceHandler(
      req('POST', 'bk-1', '/approve-final-price', { decisions: [{ name: 'Gas refill', approved: true }] }),
      {} as any,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).finalAmount).toBe(179900);
  });
  it('returns 409 when not AWAITING_PRICE_APPROVAL', async () => {
    (bookingRepo.applyAddOnDecisions as MockFn).mockResolvedValue(null);
    const res: any = await approveFinalPriceHandler(
      req('POST', 'bk-1', '/approve-final-price', { decisions: [{ name: 'Gas refill', approved: false }] }),
      {} as any,
    );
    expect(res.status).toBe(409);
  });
});

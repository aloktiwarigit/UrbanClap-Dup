import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getByBookingId: vi.fn() },
}));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  addBlockedCustomer: vi.fn(),
}));
vi.mock('../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  findShieldByTechBooking: vi.fn(),
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendAbusiveShieldAlert: vi.fn(),
}));
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

import { shieldReportHandler } from '../../src/functions/shield-report.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { addBlockedCustomer } from '../../src/cosmos/technician-repository.js';
import { createComplaint, findShieldByTechBooking } from '../../src/cosmos/complaints-repository.js';
import { sendAbusiveShieldAlert } from '../../src/services/fcm.service.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(opts: { body?: unknown; auth?: string }): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? (opts.auth ?? '') : null) },
    json: async () => opts.body ?? {},
  } as unknown as HttpRequest;
}

const baseBooking = {
  id: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-1',
  status: 'IN_PROGRESS',
  serviceId: 's',
  categoryId: 'c',
  slotDate: '2026-04-26',
  slotWindow: '09:00-11:00',
  addressText: 'addr',
  addressLatLng: { lat: 0, lng: 0 },
  paymentOrderId: 'o',
  paymentId: 'p',
  paymentSignature: 'sig',
  amount: 500,
  createdAt: '2026-04-26T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(bookingRepo.getById).mockResolvedValue(baseBooking as any);
  vi.mocked(findShieldByTechBooking).mockResolvedValue(null);
  vi.mocked(createComplaint).mockResolvedValue(undefined);
  vi.mocked(addBlockedCustomer).mockResolvedValue(undefined);
  vi.mocked(sendAbusiveShieldAlert).mockResolvedValue(undefined);
});

const validBody = { bookingId: 'bk-1', description: 'abusive behaviour' };

describe('POST /v1/technicians/me/shield-report', () => {
  it('returns 401 when no token', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('No token'));
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 403 when tech not assigned to booking', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'other-tech' });
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('returns 409 BOOKING_NOT_ELIGIBLE when status is SEARCHING (not yet assigned)', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...baseBooking, status: 'SEARCHING' } as any);
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_ELIGIBLE');
  });

  it('returns 409 SHIELD_ALREADY_FILED when duplicate report', async () => {
    vi.mocked(findShieldByTechBooking).mockResolvedValue({ id: 'existing-shield' } as any);
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('SHIELD_ALREADY_FILED');
  });

  it('returns 201 with complaintId on happy path', async () => {
    const res = await shieldReportHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(201);
    expect((res.jsonBody as any).complaintId).toBeDefined();
    expect(createComplaint).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ABUSIVE_CUSTOMER_SHIELD', technicianId: 'tech-1' }),
    );
    // Fire-and-forget calls dispatched asynchronously — give microtasks a tick to flush
    await Promise.resolve();
    expect(addBlockedCustomer).toHaveBeenCalledWith('tech-1', 'cust-1');
    expect(sendAbusiveShieldAlert).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'bk-1', technicianId: 'tech-1', customerId: 'cust-1' }),
    );
  });
});

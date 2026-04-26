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
vi.mock('../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  countAppealsByTechInMonth: vi.fn(),
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendAppealFiledAlert: vi.fn(),
}));
vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

import { ratingAppealHandler } from '../../src/functions/rating-appeal.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';
import { createComplaint, countAppealsByTechInMonth } from '../../src/cosmos/complaints-repository.js';
import { sendAppealFiledAlert } from '../../src/services/fcm.service.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(opts: { body?: unknown }): HttpRequest {
  return {
    headers: { get: () => null },
    json: async () => opts.body ?? {},
  } as unknown as HttpRequest;
}

const baseBooking = {
  id: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-1',
  status: 'CLOSED',
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

const submittedRating = {
  id: 'bk-1',
  bookingId: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-1',
  customerOverall: 2,
  customerSubmittedAt: '2026-04-26T10:00:00.000Z',
};

const validBody = {
  bookingId: 'bk-1',
  reason: 'The rating is unfair because I arrived on time and did quality work',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'tech-1' });
  vi.mocked(bookingRepo.getById).mockResolvedValue(baseBooking as any);
  vi.mocked(ratingRepo.getByBookingId).mockResolvedValue(submittedRating as any);
  vi.mocked(countAppealsByTechInMonth).mockResolvedValue(0);
  vi.mocked(createComplaint).mockResolvedValue(undefined);
  vi.mocked(sendAppealFiledAlert).mockResolvedValue(undefined);
});

describe('POST /v1/technicians/me/rating-appeal', () => {
  it('returns 401 when no token', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('No token'));
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 403 when tech not assigned', async () => {
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 'other-tech' });
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('returns 409 RATING_NOT_APPEALABLE when customerOverall is 5', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({ ...submittedRating, customerOverall: 5 } as any);
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('RATING_NOT_APPEALABLE');
  });

  it('returns 409 RATING_NOT_SUBMITTED when customerSubmittedAt absent', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({ ...submittedRating, customerSubmittedAt: undefined } as any);
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('RATING_NOT_SUBMITTED');
  });

  it('returns 409 APPEAL_QUOTA_EXCEEDED with nextAvailableAt when quota exhausted', async () => {
    vi.mocked(countAppealsByTechInMonth).mockResolvedValue(1);
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('APPEAL_QUOTA_EXCEEDED');
    expect((res.jsonBody as any).nextAvailableAt).toBeDefined();
  });

  it('returns 201 with appealId on happy path', async () => {
    const res = await ratingAppealHandler(makeReq({ body: validBody }), ctx) as HttpResponseInit;
    expect(res.status).toBe(201);
    expect((res.jsonBody as any).appealId).toBeDefined();
    expect(createComplaint).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'RATING_APPEAL', technicianId: 'tech-1' }),
    );
    await Promise.resolve();
    expect(sendAppealFiledAlert).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'bk-1', technicianId: 'tech-1' }),
    );
  });
});

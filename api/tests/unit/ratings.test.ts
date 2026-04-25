import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { submitSide: vi.fn(), getByBookingId: vi.fn() },
}));

import { submitRatingHandler, getRatingHandler } from '../../src/functions/ratings.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

function reqWith(opts: { body?: unknown; auth?: string; bookingId?: string }): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? opts.auth ?? '' : null) },
    json: async () => opts.body ?? {},
    params: { bookingId: opts.bookingId ?? '' },
  } as unknown as HttpRequest;
}

const closedBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
  serviceId: 's', categoryId: 'c', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: 'x', addressLatLng: { lat: 0, lng: 0 }, paymentOrderId: 'o', paymentId: 'p',
  paymentSignature: 's', amount: 100, createdAt: '2026-04-24T09:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'cust-1' } as any);
  vi.mocked(bookingRepo.getById).mockResolvedValue(closedBooking as any);
});

describe('POST /v1/ratings', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await submitRatingHandler(reqWith({ body: {} }), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 400 on schema validation failure', async () => {
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 7, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when booking does not exist', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-x', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is neither customer nor technician on the booking', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'someone-else' } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when customer caller submits TECH_TO_CUSTOMER side', async () => {
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'TECH_TO_CUSTOMER', bookingId: 'bk-1', overall: 5, subScores: { behaviour: 5, communication: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(403);
  });

  it('returns 409 when booking status is not CLOSED', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...closedBooking, status: 'IN_PROGRESS' } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_CLOSED');
  });

  it('returns 409 when repo reports duplicate submission', async () => {
    vi.mocked(ratingRepo.submitSide).mockResolvedValue(null);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('RATING_ALREADY_SUBMITTED');
  });

  it('returns 201 with persisted doc on success', async () => {
    vi.mocked(ratingRepo.submitSide).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
    } as any);
    const res = await submitRatingHandler(
      reqWith({ auth: 'Bearer t', body: { side: 'CUSTOMER_TO_TECH', bookingId: 'bk-1', overall: 5, subScores: { punctuality: 5, skill: 5, behaviour: 5 } } }),
      ctx,
    );
    expect(res.status).toBe(201);
    expect((res.jsonBody as any).bookingId).toBe('bk-1');
  });
});

describe('GET /v1/ratings/{bookingId}', () => {
  it('returns 401 with no auth', async () => {
    const res = await getRatingHandler(reqWith({ bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not a participant', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'stranger' } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(403);
  });

  it('hides tech side as PENDING when only customer has submitted', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
    } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('PARTIALLY_SUBMITTED');
    expect(body.customerSide.status).toBe('SUBMITTED');
    expect(body.techSide).toEqual({ status: 'PENDING' });
  });

  it('returns both sides in full once revealedAt is set', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      customerOverall: 5, customerSubScores: { punctuality: 5, skill: 5, behaviour: 5 },
      customerSubmittedAt: '2026-04-24T12:00:00.000Z',
      techOverall: 4, techSubScores: { behaviour: 4, communication: 5 },
      techSubmittedAt: '2026-04-24T12:30:00.000Z',
      revealedAt: '2026-04-24T12:30:00.000Z',
    } as any);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('REVEALED');
    expect(body.customerSide.overall).toBe(5);
    expect(body.techSide.overall).toBe(4);
  });

  it('returns PENDING when no rating doc exists', async () => {
    vi.mocked(ratingRepo.getByBookingId).mockResolvedValue(null);
    const res = await getRatingHandler(reqWith({ auth: 'Bearer t', bookingId: 'bk-1' }), ctx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.status).toBe('PENDING');
  });
});

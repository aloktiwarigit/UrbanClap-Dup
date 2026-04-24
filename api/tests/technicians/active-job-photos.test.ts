import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
    addPhoto: vi.fn(),
  },
}));

import { activeJobPhotosHandler } from '../../src/functions/active-job-photos.js';
import { verifyTechnicianToken } from '../../src/middleware/verifyTechnicianToken.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const BOOKING_ID = 'booking-123';
const TECH_UID = 'tech-456';
const PHOTO_URL = 'https://storage.googleapis.com/bucket/bookings/booking-123/photos/REACHED/ts.jpg';

const BASE_BOOKING = {
  id: BOOKING_ID,
  technicianId: TECH_UID,
  status: 'EN_ROUTE' as const, // EN_ROUTE → valid photo stage is 'REACHED'
  photos: {},
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '09:00-11:00',
  addressText: '1 Main St',
  addressLatLng: { lat: 12.9, lng: 77.6 },
  paymentOrderId: 'ord-1',
  paymentId: null,
  paymentSignature: null,
  amount: 500,
  createdAt: '2026-05-01T06:00:00.000Z',
};

function makeRequest(body: unknown, bookingId = BOOKING_ID): HttpRequest {
  return {
    params: { bookingId },
    headers: { get: () => 'Bearer token' },
    json: async () => body,
  } as unknown as HttpRequest;
}

const CTX = {} as InvocationContext;

describe('POST /v1/technicians/active-job/:bookingId/photos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: TECH_UID });
    vi.mocked(bookingRepo.getById).mockResolvedValue(BASE_BOOKING);
    vi.mocked(bookingRepo.addPhoto).mockResolvedValue({
      ...BASE_BOOKING,
      photos: { REACHED: [PHOTO_URL] },
    });
  });

  it('records photo URL and returns 200', async () => {
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'REACHED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).ok).toBe(true);
    expect(bookingRepo.addPhoto).toHaveBeenCalledWith(BOOKING_ID, 'REACHED', PHOTO_URL);
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('Unauthorized'));
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'REACHED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'REACHED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is not the assigned technician', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, technicianId: 'other-tech' });
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'REACHED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid stage', async () => {
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'PENDING_PAYMENT', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when photoUrl is missing', async () => {
    const res = await activeJobPhotosHandler(makeRequest({ stage: 'REACHED' }), CTX);
    expect(res.status).toBe(400);
  });

  it('returns 409 when stage does not match next expected transition', async () => {
    // Booking is ASSIGNED — only EN_ROUTE stage is valid; posting COMPLETED should be rejected
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...BASE_BOOKING, status: 'ASSIGNED' });
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'COMPLETED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(409);
  });

  it('returns 409 on ETag conflict (concurrent upload retry)', async () => {
    const etagConflict = Object.assign(new Error('ETag conflict'), { code: 412 });
    vi.mocked(bookingRepo.addPhoto).mockRejectedValue(etagConflict);
    const res = await activeJobPhotosHandler(
      makeRequest({ stage: 'REACHED', photoUrl: PHOTO_URL }),
      CTX,
    );
    expect(res.status).toBe(409);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  findRatingShieldEscalation: vi.fn(),
}));
vi.mock('../../src/cosmos/rating-repository.js', () => ({
  ratingRepo: { getByBookingId: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendOwnerRatingShieldAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'customer_1' }),
}));
vi.mock('../../src/services/auditLog.service.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { ratingRepo } from '../../src/cosmos/rating-repository.js';
import { createComplaint, findRatingShieldEscalation } from '../../src/cosmos/complaints-repository.js';
import { escalateRatingHandler } from '../../src/functions/rating-escalate.js';
import { auditLog } from '../../src/services/auditLog.service.js';

const closedBooking = { id: 'bk-1', customerId: 'customer_1', technicianId: 'tech_1', status: 'CLOSED' };
const mockCustomer = { customerId: 'customer_1' };
const mockCtx = { error: vi.fn() } as unknown as InvocationContext;

function makeReq(body: unknown = {}, bookingId = 'bk-1'): HttpRequest {
  return {
    params: { bookingId },
    query: { get: () => null, has: () => false },
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as HttpRequest;
}

describe('escalateRatingHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing rating — escalation is valid
    (ratingRepo.getByBookingId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('returns 404 when booking not found', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(404);
    expect(res.jsonBody).toMatchObject({ code: 'BOOKING_NOT_FOUND' });
  });

  it('returns 403 when caller is not the booking customer', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, customerId: 'other' });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(403);
    expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('returns 409 BOOKING_NOT_CLOSED when booking status is not CLOSED', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, status: 'PAID' });
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'BOOKING_NOT_CLOSED' });
  });

  it('returns 409 SHIELD_ALREADY_ESCALATED on duplicate escalation', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'SHIELD_ALREADY_ESCALATED' });
  });

  it('returns 409 RATING_ALREADY_SUBMITTED when customer has already rated', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (ratingRepo.getByBookingId as ReturnType<typeof vi.fn>).mockResolvedValue({
      customerSubmittedAt: '2026-04-25T10:00:00.000Z',
    });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'RATING_ALREADY_SUBMITTED' });
  });

  it('returns 400 VALIDATION_ERROR when draftOverall > 2', async () => {
    const res = await escalateRatingHandler(makeReq({ draftOverall: 3 }), mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(bookingRepo.getById).not.toHaveBeenCalled();
  });

  it('returns 201 with complaintId and expiresAt ~2h from now on success', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const before = Date.now();
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    const after = Date.now();
    expect(res.status).toBe(201);
    const body = res.jsonBody as Record<string, unknown>;
    expect(typeof body['complaintId']).toBe('string');
    const expiresAtMs = new Date(body['expiresAt'] as string).getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    expect(expiresAtMs - before).toBeGreaterThanOrEqual(twoHoursMs - 1000);
    expect(expiresAtMs - after).toBeLessThanOrEqual(twoHoursMs + 1000);
  });

  it('calls createComplaint with RATING_SHIELD type and draftOverall', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await escalateRatingHandler(makeReq({ draftOverall: 1, draftComment: 'bad work' }), mockCtx, mockCustomer);
    expect(createComplaint).toHaveBeenCalledWith(expect.objectContaining({
      type: 'RATING_SHIELD',
      draftOverall: 1,
      draftComment: 'bad work',
      status: 'NEW',
      customerId: 'customer_1',
    }));
  });

  it('returns 400 INVALID_JSON when body cannot be parsed', async () => {
    const badReq = {
      params: { bookingId: 'bk-1' },
      query: { get: () => null, has: () => false },
      headers: { get: () => null },
      json: () => Promise.reject(new SyntaxError('bad json')),
    } as unknown as HttpRequest;
    const res = await escalateRatingHandler(badReq, mockCtx, mockCustomer);
    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'INVALID_JSON' });
  });

  it('emits RATING_SHIELD_ESCALATED audit on successful escalation', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findRatingShieldEscalation as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await escalateRatingHandler(makeReq({ draftOverall: 1 }), mockCtx, mockCustomer);
    expect(vi.mocked(auditLog)).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'system', role: 'system' }),
      'RATING_SHIELD_ESCALATED',
      'complaint',
      expect.any(String),
      expect.objectContaining({
        bookingId: 'bk-1',
        customerId: 'customer_1',
        technicianId: 'tech_1',
        draftOverall: 1,
      }),
    );
  });

  it('returns 409 NO_TECHNICIAN when booking has no assigned technician', async () => {
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, technicianId: null });
    const res = await escalateRatingHandler(makeReq({ draftOverall: 2 }), mockCtx, mockCustomer);
    expect(res.status).toBe(409);
    expect(res.jsonBody).toMatchObject({ code: 'NO_TECHNICIAN' });
  });
});

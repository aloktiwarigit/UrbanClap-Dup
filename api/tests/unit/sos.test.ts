import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn(), markSosActivated: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js', () => ({
  sendOwnerSosAlert: vi.fn(),
}));
vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { sosHandler } from '../../src/functions/sos.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { sendOwnerSosAlert } from '../../src/services/fcm.service.js';
import { appendAuditEntry } from '../../src/cosmos/audit-log-repository.js';
import type { BookingDoc } from '../../src/schemas/booking.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(opts: { auth?: string; bookingId?: string }): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? (opts.auth ?? '') : null) },
    params: { bookingId: opts.bookingId ?? 'bk-1' },
  } as unknown as HttpRequest;
}

const inProgressBooking: BookingDoc = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'IN_PROGRESS',
  serviceId: 's', categoryId: 'c', slotDate: '2026-04-26', slotWindow: '10:00-12:00',
  addressText: '42 MG Road, Bangalore', addressLatLng: { lat: 12.97, lng: 77.59 },
  paymentOrderId: 'ord-1', paymentId: 'pay-1', paymentSignature: 'sig-1',
  amount: 120000, createdAt: '2026-04-26T04:30:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'cust-1' } as any);
  vi.mocked(bookingRepo.getById).mockResolvedValue(inProgressBooking);
  vi.mocked(bookingRepo.markSosActivated).mockResolvedValue({ ...inProgressBooking, sosActivatedAt: '2026-04-26T06:00:00.000Z' });
  vi.mocked(sendOwnerSosAlert).mockResolvedValue(undefined);
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined);
});

describe('POST /v1/sos/{bookingId}', () => {
  it('returns 401 when no Authorization header', async () => {
    const res = await sosHandler(makeReq({}), ctx) as HttpResponseInit;
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);
    const res = await sosHandler(makeReq({ auth: 'Bearer tok', bookingId: 'bk-x' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(404);
  });

  it('returns 403 when caller is not the booking customer', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'other-cust' } as any);
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(403);
  });

  it('returns 409 BOOKING_NOT_IN_PROGRESS when status is not IN_PROGRESS', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...inProgressBooking, status: 'ASSIGNED' });
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('BOOKING_NOT_IN_PROGRESS');
  });

  it('returns 200 when SOS already activated (idempotent)', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...inProgressBooking, sosActivatedAt: '2026-04-26T05:00:00.000Z' });
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect(bookingRepo.markSosActivated).not.toHaveBeenCalled();
    expect(sendOwnerSosAlert).not.toHaveBeenCalled();
  });

  it('returns 201 on success and fires FCM + audit (non-blocking)', async () => {
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(201);
    expect(bookingRepo.markSosActivated).toHaveBeenCalledWith('bk-1');
    expect(sendOwnerSosAlert).toHaveBeenCalledWith({
      bookingId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', slotAddress: '42 MG Road, Bangalore',
    });
    expect(appendAuditEntry).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SOS_TRIGGERED', resourceType: 'booking', resourceId: 'bk-1', role: 'system',
    }));
  });

  it('FCM failure propagates so the booking stays unmarked and the client can retry', async () => {
    vi.mocked(sendOwnerSosAlert).mockRejectedValue(new Error('FCM down'));
    await expect(sosHandler(makeReq({ auth: 'Bearer tok' }), ctx)).rejects.toThrow('FCM down');
    expect(bookingRepo.markSosActivated).not.toHaveBeenCalled();
  });

  it('FCM payload uses empty string when technicianId is absent', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({ ...inProgressBooking, technicianId: undefined });
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(201);
    expect(sendOwnerSosAlert).toHaveBeenCalledWith(
      expect.objectContaining({ technicianId: '' }),
    );
  });

  it('returns 200 ALREADY_PROCESSED when markSosActivated returns null (ETag race — owner alert was already sent)', async () => {
    vi.mocked(bookingRepo.markSosActivated).mockResolvedValue(null);
    const res = await sosHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).code).toBe('ALREADY_PROCESSED');
    expect(sendOwnerSosAlert).toHaveBeenCalled();
  });
});

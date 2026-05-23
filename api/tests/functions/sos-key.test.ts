import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../src/cosmos/sos-incident-key-repository.js', () => ({
  putKeyDoc: vi.fn(),
  getKeyDoc: vi.fn(),
}));
vi.mock('../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { sosKeyHandler } from '../../src/functions/sos-key.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../src/cosmos/booking-repository.js';
import { putKeyDoc, getKeyDoc } from '../../src/cosmos/sos-incident-key-repository.js';
import { appendAuditEntry } from '../../src/cosmos/audit-log-repository.js';
import type { BookingDoc } from '../../src/schemas/booking.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(opts: {
  auth?: string;
  incidentId?: string;
  body?: unknown;
}): HttpRequest {
  return {
    headers: { get: (h: string) => (h.toLowerCase() === 'authorization' ? (opts.auth ?? '') : null) },
    params: { incidentId: opts.incidentId ?? 'bk-1' },
    json: async () => opts.body ?? validBody,
  } as unknown as HttpRequest;
}

const validBody = {
  keyB64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ivB64: 'AAAAAAAAAAAAAAAA',
  storagePath: 'sos-audio/cust-1/bk-1.enc',
};

const activeBooking: BookingDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  technicianId: 'tech-1',
  status: 'IN_PROGRESS',
  sosActivatedAt: '2026-05-17T10:00:00.000Z',
  serviceId: 's',
  categoryId: 'c',
  slotDate: '2026-05-17',
  slotWindow: '10:00-12:00',
  addressText: '42 MG Road',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  paymentOrderId: 'ord-1',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 120000,
  createdAt: '2026-05-17T04:30:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'cust-1' } as any);
  vi.mocked(bookingRepo.getById).mockResolvedValue(activeBooking);
  vi.mocked(getKeyDoc).mockResolvedValue(null);
  vi.mocked(putKeyDoc).mockResolvedValue(undefined);
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined);
});

describe('POST /v1/sos/{incidentId}/key', () => {
  it('posts_key_doc_when_authenticated_owner_with_active_sos', async () => {
    const res = await sosKeyHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(201);
    expect(putKeyDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'bk-1',
        customerId: 'cust-1',
        keyB64: validBody.keyB64,
        ivB64: validBody.ivB64,
        storagePath: validBody.storagePath,
      }),
    );
  });

  it('rejects_when_booking_not_in_progress_or_sos_not_activated', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue({
      ...activeBooking,
      sosActivatedAt: undefined,
    });
    const res = await sosKeyHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(409);
    expect((res.jsonBody as any).code).toBe('SOS_NOT_ACTIVATED');
  });

  it('rejects_when_customerId_mismatch', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'other-cust' } as any);
    const res = await sosKeyHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('returns_already_processed_on_second_upload_same_incident', async () => {
    vi.mocked(getKeyDoc).mockResolvedValue({
      id: 'bk-1',
      customerId: 'cust-1',
      keyB64: validBody.keyB64,
      ivB64: validBody.ivB64,
      storagePath: validBody.storagePath,
      createdAt: '2026-05-17T10:00:00.000Z',
      ttl: 604800,
    });
    const res = await sosKeyHandler(makeReq({ auth: 'Bearer tok' }), ctx) as HttpResponseInit;
    expect(res.status).toBe(200);
    expect((res.jsonBody as any).code).toBe('ALREADY_PROCESSED');
    expect(putKeyDoc).not.toHaveBeenCalled();
  });
});

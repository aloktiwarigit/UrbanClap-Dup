import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import type { AdminContext } from '../../../../src/types/admin.js';
// AdminHttpHandler type used via test calls only

vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../../../src/cosmos/sos-incident-key-repository.js', () => ({
  getKeyDoc: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  getSessionById: vi.fn(),
}));
vi.mock('../../../../src/cosmos/audit-log-repository.js', () => ({
  appendAuditEntry: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(),
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

import { adminSosPlaybackTokenHandler } from '../../../../src/functions/admin/sos/playback-token.js';
import { bookingRepo } from '../../../../src/cosmos/booking-repository.js';
import { getKeyDoc } from '../../../../src/cosmos/sos-incident-key-repository.js';
import { getSessionById } from '../../../../src/services/adminSession.service.js';
import { getFirebaseAdmin } from '../../../../src/services/firebaseAdmin.js';
import { appendAuditEntry } from '../../../../src/cosmos/audit-log-repository.js';
import type { BookingDoc } from '../../../../src/schemas/booking.js';
import type { SosIncidentKeyDoc } from '../../../../src/schemas/sos.js';

const ctx = { log: vi.fn(), error: vi.fn() } as unknown as InvocationContext;

function makeReq(incidentId = 'bk-1'): HttpRequest {
  return {
    params: { incidentId },
    query: { get: () => null },
  } as unknown as HttpRequest;
}

const mockAdmin: AdminContext = {
  adminId: 'admin-1',
  role: 'ops-manager',
  sessionId: 'sess-1',
};

const freshSession = {
  id: 'sess-1',
  sessionId: 'sess-1',
  adminId: 'admin-1',
  role: 'ops-manager' as const,
  lastActivityAt: new Date().toISOString(),
  hardExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  refreshTokenHash: 'h',
  totpVerifiedAt: new Date().toISOString(),
};

const staleSession = {
  ...freshSession,
  totpVerifiedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
};

const sampleBooking: BookingDoc = {
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

const sampleKeyDoc: SosIncidentKeyDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  keyB64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ivB64: 'AAAAAAAAAAAAAAAA',
  storagePath: 'sos-audio/cust-1/bk-1.enc',
  createdAt: '2026-05-17T10:00:00.000Z',
  ttl: 604800,
};

const mockGetSignedUrl = vi.fn().mockResolvedValue(['https://storage.googleapis.com/signed-url']);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(bookingRepo.getById).mockResolvedValue(sampleBooking);
  vi.mocked(getKeyDoc).mockResolvedValue(sampleKeyDoc);
  vi.mocked(getSessionById).mockResolvedValue(freshSession);
  vi.mocked(appendAuditEntry).mockResolvedValue(undefined);
  mockGetSignedUrl.mockResolvedValue(['https://storage.googleapis.com/signed-url']);
  vi.mocked(getFirebaseAdmin).mockReturnValue({
    storage: () => ({
      bucket: () => ({
        file: () => ({ getSignedUrl: mockGetSignedUrl }),
      }),
    }),
  } as unknown as ReturnType<typeof getFirebaseAdmin>);
});

describe('GET /v1/admin/sos/{incidentId}/playback-token', () => {
  it('returns_token_for_authorized_admin_with_fresh_totp', async () => {
    const res = await adminSosPlaybackTokenHandler(makeReq(), ctx, mockAdmin);
    expect(res.status).toBe(200);
    const body = res.jsonBody as any;
    expect(body.incidentId).toBe('bk-1');
    expect(body.keyB64).toBe(sampleKeyDoc.keyB64);
    expect(body.ivB64).toBe(sampleKeyDoc.ivB64);
    expect(body.signedStorageUrl).toBeTruthy();
    expect(body.signedUrlExpiresAt).toBeTruthy();
  });

  it('rejects_when_totp_session_stale_more_than_5_min', async () => {
    vi.mocked(getSessionById).mockResolvedValue(staleSession);
    const res = await adminSosPlaybackTokenHandler(makeReq(), ctx, mockAdmin);
    expect(res.status).toBe(401);
    expect((res.jsonBody as any).code).toBe('TOTP_REFRESH_REQUIRED');
  });

  it('rejects_when_admin_role_is_finance_only', async () => {
    const financeAdmin: AdminContext = { ...mockAdmin, role: 'finance' };
    const res = await adminSosPlaybackTokenHandler(makeReq(), ctx, financeAdmin);
    expect(res.status).toBe(403);
    expect((res.jsonBody as any).code).toBe('FORBIDDEN');
  });

  it('returns_key_not_found_when_audio_was_never_uploaded', async () => {
    vi.mocked(getKeyDoc).mockResolvedValue(null);
    const res = await adminSosPlaybackTokenHandler(makeReq(), ctx, mockAdmin);
    expect(res.status).toBe(404);
    expect((res.jsonBody as any).code).toBe('KEY_NOT_FOUND');
  });
});

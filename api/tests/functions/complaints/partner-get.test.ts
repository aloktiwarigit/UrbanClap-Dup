import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaintsByBookingAndParty: vi.fn(),
  createComplaint: vi.fn(),
  findActiveComplaintByBookingAndParty: vi.fn(),
  queryComplaints: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
  getUnacknowledgedPastDueComplaints: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { queryComplaintsByBookingAndParty } from '../../../src/cosmos/complaints-repository.js';
import { partnerGetComplaintsHandler } from '../../../src/functions/complaints/partner-get.js';

function makeReq(bookingId: string, token = 'Bearer valid-token'): HttpRequest {
  return {
    headers: { get: (k: string) => k === 'authorization' ? token : null },
    params: { bookingId },
  } as unknown as HttpRequest;
}

const closedBooking = { id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED' };

const mockComplaint = {
  id: 'c-1', orderId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
  description: 'A valid complaint description that is long enough.',
  status: 'NEW', internalNotes: [], slaDeadlineAt: '2026-04-26T00:00:00Z',
  escalated: false, createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z',
  filedBy: 'CUSTOMER', reasonCode: 'SERVICE_QUALITY',
};

describe('GET /v1/complaints/{bookingId} (partner)', () => {
  let mockCtx: InvocationContext;
  beforeEach(() => {
    mockCtx = {} as InvocationContext;
    vi.clearAllMocks();
  });

  it('returns 401 when no Bearer token', async () => {
    const res = await partnerGetComplaintsHandler(makeReq('bk-1', ''), mockCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token is invalid', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad'));
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 403 when caller is not a booking participant', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'stranger' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 200 with complaints array for customer', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (queryComplaintsByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue([mockComplaint]);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { complaints: unknown[] };
    expect(body.complaints).toHaveLength(1);
  });

  it('returns 200 with empty array when no complaints filed', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (queryComplaintsByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { complaints: unknown[] }).complaints).toHaveLength(0);
  });
});

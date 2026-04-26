import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
  },
}));
vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  findComplaintByBookingAndParty: vi.fn(),
  queryComplaintsByBookingAndParty: vi.fn(),
  queryComplaints: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
  getUnacknowledgedPastDueComplaints: vi.fn(),
}));
vi.mock('../../../src/services/fcm.service.js', () => ({
  sendOwnerComplaintFiled: vi.fn().mockResolvedValue(undefined),
  sendOwnerRouteAlert: vi.fn(),
  sendPriceApprovalPush: vi.fn(),
  sendTechEarningsUpdate: vi.fn(),
  sendRatingPromptCustomerPush: vi.fn(),
  sendRatingPromptTechnicianPush: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { createComplaint, findComplaintByBookingAndParty } from '../../../src/cosmos/complaints-repository.js';
import { partnerCreateComplaintHandler } from '../../../src/functions/complaints/partner-create.js';

function makeReq(body: unknown, token = 'Bearer valid-token'): HttpRequest {
  return {
    headers: { get: (k: string) => k === 'authorization' ? token : null },
    json: () => Promise.resolve(body),
  } as unknown as HttpRequest;
}
let mockCtx: InvocationContext;
const closedBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
};
const validCustomerBody = {
  bookingId: 'bk-1',
  reasonCode: 'SERVICE_QUALITY',
  description: 'Technician left without completing the assigned work properly.',
};

describe('POST /v1/complaints (partner)', () => {
  beforeEach(() => {
    mockCtx = { error: vi.fn() } as unknown as InvocationContext;
    vi.clearAllMocks();
  });

  it('returns 401 when no Bearer token', async () => {
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody, ''), mockCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token is invalid', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad token'));
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('TOKEN_INVALID');
  });

  it('returns 404 when booking not found', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 403 when caller is not a booking participant', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'stranger-uid' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 409 BOOKING_NOT_ELIGIBLE when booking is not CLOSED', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, status: 'IN_PROGRESS' });
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_ELIGIBLE');
  });

  it('returns 409 COMPLAINT_ALREADY_FILED when active complaint exists', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing-c' });
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('COMPLAINT_ALREADY_FILED');
  });

  it('returns 400 INVALID_REASON_CODE when customer uses a technician reason code', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerCreateComplaintHandler(
      makeReq({ ...validCustomerBody, reasonCode: 'CUSTOMER_MISCONDUCT' }), mockCtx,
    );
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_REASON_CODE');
  });

  it('returns 201 with partner-safe response (no internal fields) for a valid customer complaint', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await partnerCreateComplaintHandler(makeReq(validCustomerBody), mockCtx);
    expect(res.status).toBe(201);
    const doc = res.jsonBody as Record<string, unknown>;
    expect(doc['filedBy']).toBe('CUSTOMER');
    expect(doc['reasonCode']).toBe('SERVICE_QUALITY');
    expect(doc['status']).toBe('NEW');
    expect(doc['acknowledgeDeadlineAt']).toBeDefined();
    expect(doc['slaDeadlineAt']).toBeDefined();
    // Must NOT expose internal fields
    expect(doc['customerId']).toBeUndefined();
    expect(doc['technicianId']).toBeUndefined();
    expect(doc['internalNotes']).toBeUndefined();
    expect(doc['assigneeAdminId']).toBeUndefined();
    expect(doc['escalated']).toBeUndefined();
    expect(doc['ackBreached']).toBeUndefined();
  });

  it('returns 201 for a valid technician complaint with tech reason code', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await partnerCreateComplaintHandler(
      makeReq({ ...validCustomerBody, reasonCode: 'LATE_PAYMENT' }), mockCtx,
    );
    expect(res.status).toBe(201);
    expect((res.jsonBody as { filedBy: string }).filedBy).toBe('TECHNICIAN');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    const badReq = {
      headers: { get: (k: string) => k === 'authorization' ? 'Bearer valid-token' : null },
      json: () => Promise.reject(new SyntaxError('Invalid JSON')),
    } as unknown as HttpRequest;
    const res = await partnerCreateComplaintHandler(badReq, mockCtx);
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_JSON');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/dispatch-attempt-repository.js', () => ({
  dispatchAttemptRepo: {
    getByBookingId: vi.fn(),
    acceptAttempt: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: {
    append: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
  },
  updateBookingFields: vi.fn(),
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: vi.fn().mockReturnValue({
    send: vi.fn().mockResolvedValue('message-id'),
  }),
}));

function makeReq(bookingId: string, suffix: string): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/job-offers/${bookingId}/${suffix}`,
    method: 'PATCH',
    headers: { authorization: 'Bearer test-token' },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

const pendingAttempt = () => ({
  id: 'da-1',
  bookingId: 'bk-1',
  technicianIds: ['tech-1', 'tech-2'],
  sentAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  status: 'PENDING' as const,
});

type MockFn = ReturnType<typeof vi.fn>;

describe('PATCH /v1/technicians/job-offers/:bookingId/accept', () => {
  let acceptHandler: typeof import('../../src/functions/job-offers.js').acceptJobOfferHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/job-offers.js');
    acceptHandler = mod.acceptJobOfferHandler;
  });

  it('returns 200 ASSIGNED on first caller', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');
    const { updateBookingFields } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (dispatchAttemptRepo.getByBookingId as MockFn).mockResolvedValue(pendingAttempt());
    (dispatchAttemptRepo.acceptAttempt as MockFn).mockResolvedValue({ id: 'da-1', bookingId: 'bk-1', technicianIds: ['tech-1', 'tech-2'], sentAt: '', expiresAt: '', status: 'ACCEPTED' as const });
    (updateBookingFields as MockFn).mockResolvedValue({ id: 'bk-1', customerId: 'c1', serviceId: 's1', categoryId: 'cat1', slotDate: '2026-01-01', slotWindow: '09:00-11:00', addressText: 'Addr', addressLatLng: { lat: 0, lng: 0 }, status: 'ASSIGNED', paymentOrderId: 'o1', paymentId: null, paymentSignature: null, amount: 100, createdAt: '', technicianId: 'tech-1' });

    const res = await acceptHandler(makeReq('bk-1', 'accept'), new InvocationContext());
    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('ASSIGNED');
  });

  it('returns 409 when _etag race lost (acceptAttempt returns null)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (dispatchAttemptRepo.getByBookingId as MockFn).mockResolvedValue(pendingAttempt());
    (dispatchAttemptRepo.acceptAttempt as MockFn).mockResolvedValue(null);

    const res = await acceptHandler(makeReq('bk-1', 'accept'), new InvocationContext());
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('OFFER_ALREADY_TAKEN');
  });

  it('returns 410 when offer expiresAt has already passed', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (dispatchAttemptRepo.getByBookingId as MockFn).mockResolvedValue({
      id: 'da-1',
      bookingId: 'bk-1',
      technicianIds: ['tech-1', 'tech-2'],
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      status: 'PENDING' as const,
    });

    const res = await acceptHandler(makeReq('bk-1', 'accept'), new InvocationContext());
    expect(res.status).toBe(410);
    expect((res.jsonBody as { code: string }).code).toBe('OFFER_EXPIRED');
  });

  it('returns 403 when technicianId not in attempt.technicianIds', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (dispatchAttemptRepo.getByBookingId as MockFn).mockResolvedValue({
      id: 'da-1',
      bookingId: 'bk-1',
      technicianIds: ['tech-99', 'tech-88'],
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      status: 'PENDING' as const,
    });

    const res = await acceptHandler(makeReq('bk-1', 'accept'), new InvocationContext());
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 410 when attempt status is not PENDING', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (dispatchAttemptRepo.getByBookingId as MockFn).mockResolvedValue({
      id: 'da-1',
      bookingId: 'bk-1',
      technicianIds: ['tech-1'],
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      status: 'ACCEPTED' as const,
    });

    const res = await acceptHandler(makeReq('bk-1', 'accept'), new InvocationContext());
    expect(res.status).toBe(410);
  });
});

describe('PATCH /v1/technicians/job-offers/:bookingId/decline', () => {
  let declineHandler: typeof import('../../src/functions/job-offers.js').declineJobOfferHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/job-offers.js');
    declineHandler = mod.declineJobOfferHandler;
  });

  it('returns 200 DECLINED and does not modify booking or dispatch attempt', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { dispatchAttemptRepo } = await import('../../src/cosmos/dispatch-attempt-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });

    const res = await declineHandler(makeReq('bk-1', 'decline'), new InvocationContext());
    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('DECLINED');
    expect((updateBookingFields as MockFn).mock.calls).toHaveLength(0);
    expect((dispatchAttemptRepo.acceptAttempt as MockFn).mock.calls).toHaveLength(0);
  });

  it('appends TECH_DECLINED event with no ranking field', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingEventRepo } = await import('../../src/cosmos/booking-event-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });

    await declineHandler(makeReq('bk-1', 'decline'), new InvocationContext());
    const appendCalls = (bookingEventRepo.append as MockFn).mock.calls;
    expect(appendCalls).toHaveLength(1);
    const callArg: Record<string, unknown> = appendCalls[0]![0] as Record<string, unknown>;
    expect(callArg['event']).toBe('TECH_DECLINED');
    expect(callArg['bookingId']).toBe('bk-1');
    expect(callArg).not.toHaveProperty('ranking');
    expect(callArg).not.toHaveProperty('score');
    expect(callArg).not.toHaveProperty('dispatchScore');
  });
});

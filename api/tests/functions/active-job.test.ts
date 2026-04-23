import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, InvocationContext, type HttpResponseInit } from '@azure/functions';

vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
  updateBookingFields: vi.fn(),
}));

vi.mock('../../src/cosmos/booking-event-repository.js', () => ({
  bookingEventRepo: { append: vi.fn() },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

type MockFn = ReturnType<typeof vi.fn>;

const aBooking = (status = 'ASSIGNED') => ({
  id: 'bk-1', customerId: 'c-1', serviceId: 'svc-1', categoryId: 'cat-1',
  slotDate: '2026-05-01', slotWindow: '10:00-12:00',
  addressText: '12 Main St', addressLatLng: { lat: 12.9, lng: 77.6 },
  status, paymentOrderId: 'o-1', paymentId: null, paymentSignature: null,
  amount: 50000, technicianId: 'tech-1', createdAt: new Date().toISOString(),
});

const aService = () => ({
  id: 'svc-1', name: 'AC Repair', basePrice: 50000, isActive: true,
  categoryId: 'cat-1', createdAt: '', updatedAt: '', updatedBy: '',
});

function makeGetReq(bookingId: string): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/active-job/${bookingId}`,
    method: 'GET',
    headers: { authorization: 'Bearer test-token' },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

function makePatchReq(bookingId: string, body: unknown): HttpRequest {
  const req = new HttpRequest({
    url: `http://localhost/api/v1/technicians/active-job/${bookingId}/transition`,
    method: 'PATCH',
    headers: { authorization: 'Bearer test-token' },
    body: { string: JSON.stringify(body) },
  });
  Object.assign(req, { params: { bookingId } });
  return req;
}

describe('GET /v1/technicians/active-job/:bookingId', () => {
  let getActiveJobHandler: typeof import('../../src/functions/active-job.js').getActiveJobHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/active-job.js');
    getActiveJobHandler = mod.getActiveJobHandler;
  });

  it('returns 200 with enriched booking for assigned technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(200);
    const body = res.jsonBody as Record<string, unknown>;
    expect(body['status']).toBe('ASSIGNED');
    expect(body['serviceName']).toBe('AC Repair');
  });

  it('returns 403 if booking.technicianId !== caller uid', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-99' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking());

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 404 when booking not found', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(null);

    const res = await getActiveJobHandler(makeGetReq('bk-1'), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/technicians/active-job/:bookingId/transition', () => {
  let transitionHandler: typeof import('../../src/functions/active-job.js').transitionStatusHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import('../../src/functions/active-job.js');
    transitionHandler = mod.transitionStatusHandler;
  });

  it('returns 200 when ASSIGNED → EN_ROUTE (legal one-step forward)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'EN_ROUTE' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { status: string }).status).toBe('EN_ROUTE');
  });

  it('returns 409 when ASSIGNED → IN_PROGRESS (skips a step)', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'IN_PROGRESS' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('ILLEGAL_TRANSITION');
  });

  it('returns 403 when caller is not the assigned technician', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-99' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('ASSIGNED'));

    const res = await transitionHandler(makePatchReq('bk-1', { targetStatus: 'EN_ROUTE' }), new InvocationContext()) as HttpResponseInit;

    expect(res.status).toBe(403);
  });

  it('appends STATUS_TRANSITION BookingEvent with from/to metadata', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo, updateBookingFields } = await import('../../src/cosmos/booking-repository.js');
    const { bookingEventRepo } = await import('../../src/cosmos/booking-event-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');

    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as MockFn).mockResolvedValue(aBooking('EN_ROUTE'));
    (updateBookingFields as MockFn).mockResolvedValue(aBooking('REACHED'));
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue(aService());

    await transitionHandler(makePatchReq('bk-1', { targetStatus: 'REACHED' }), new InvocationContext());

    const appendCalls = (bookingEventRepo.append as MockFn).mock.calls;
    expect(appendCalls).toHaveLength(1);
    const arg = appendCalls[0]![0] as Record<string, unknown>;
    expect(arg['event']).toBe('STATUS_TRANSITION');
    expect(arg['technicianId']).toBe('tech-1');
    expect(arg['metadata']).toEqual({ from: 'EN_ROUTE', to: 'REACHED' });
  });
});

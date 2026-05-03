import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.mock('../../src/bootstrap.js', () => ({}));
vi.mock('../../src/middleware/verifyTechnicianToken.js', () => ({
  verifyTechnicianToken: vi.fn(),
}));
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getByTechnicianId: vi.fn() },
}));
vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

type MockFn = ReturnType<typeof vi.fn>;

function makeReq(): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/technicians/me/bookings',
    method: 'GET',
    headers: { Authorization: 'Bearer test-token' },
  });
}

const ctx = { error: vi.fn() } as unknown as InvocationContext;

describe('GET /v1/technicians/me/bookings', () => {
  let handler: typeof import('../../src/functions/technician-bookings.js').getMyTechnicianBookingsHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = (await import('../../src/functions/technician-bookings.js')).getMyTechnicianBookingsHandler;
  });

  it('returns 401 when technician auth fails', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    (verifyTechnicianToken as MockFn).mockRejectedValue(new Error('bad token'));

    const res = (await handler(makeReq(), ctx)) as HttpResponseInit;

    expect(res.status).toBe(401);
    expect(res.jsonBody).toEqual({ code: 'UNAUTHENTICATED' });
  });

  it('returns assigned technician bookings with service names and final amount', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getByTechnicianId as MockFn).mockResolvedValue([
      {
        id: 'bk-1',
        customerId: 'cust-1',
        serviceId: 'ac-deep-clean',
        addressText: '101 Ayodhya',
        addressLatLng: { lat: 12.9, lng: 77.6 },
        status: 'IN_PROGRESS',
        slotDate: '2026-05-03',
        slotWindow: '10:00-12:00',
        amount: 89900,
        finalAmount: 99900,
      },
    ]);
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue({ name: 'AC deep clean' });

    const res = (await handler(makeReq(), ctx)) as HttpResponseInit;

    expect(bookingRepo.getByTechnicianId).toHaveBeenCalledWith('tech-1');
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      bookings: [
        {
          bookingId: 'bk-1',
          customerId: 'cust-1',
          serviceId: 'ac-deep-clean',
          serviceName: 'AC deep clean',
          addressText: '101 Ayodhya',
          addressLatLng: { lat: 12.9, lng: 77.6 },
          status: 'IN_PROGRESS',
          slotDate: '2026-05-03',
          slotWindow: '10:00-12:00',
          amount: 99900,
        },
      ],
    });
  });

  it('returns a structured 500 when Cosmos fails', async () => {
    const { verifyTechnicianToken } = await import('../../src/middleware/verifyTechnicianToken.js');
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (verifyTechnicianToken as MockFn).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getByTechnicianId as MockFn).mockRejectedValue(new Error('Cosmos timeout'));

    const res = (await handler(makeReq(), ctx)) as HttpResponseInit;

    expect(res.status).toBe(500);
    expect(res.jsonBody).toEqual({ code: 'INTERNAL_ERROR' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';

vi.mock('../../src/middleware/requireCustomer.js', () => ({
  requireCustomer: (handler: (req: HttpRequest, ctx: InvocationContext, claims: { customerId: string }) => Promise<unknown>) =>
    (req: HttpRequest, ctx: InvocationContext) => handler(req, ctx, { customerId: 'cust-1' }),
}));

vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getByCustomerId: vi.fn() },
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));

type MockFn = ReturnType<typeof vi.fn>;

function makeReq(): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/bookings',
    method: 'GET',
    headers: { Authorization: 'Bearer test-token' },
  });
}

const ctx = { error: vi.fn() } as unknown as InvocationContext;

describe('GET /v1/bookings', () => {
  let handler: typeof import('../../src/functions/bookings.js').getMyBookingsHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = (await import('../../src/functions/bookings.js')).getMyBookingsHandler;
  });

  it('returns current customer bookings with service names and final amount', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    const { catalogueRepo } = await import('../../src/cosmos/catalogue-repository.js');
    (bookingRepo.getByCustomerId as MockFn).mockResolvedValue([
      {
        id: 'bk-1',
        customerId: 'cust-1',
        serviceId: 'ac-deep-clean',
        addressText: '101 Ayodhya',
        addressLatLng: { lat: 26.79, lng: 82.2 },
        status: 'ASSIGNED',
        slotDate: '2026-05-05',
        slotWindow: '10:00-12:00',
        amount: 89900,
        finalAmount: 99900,
        paymentMethod: 'CASH_ON_SERVICE',
        createdAt: '2026-05-03T10:00:00.000Z',
      },
    ]);
    (catalogueRepo.getServiceByIdCrossPartition as MockFn).mockResolvedValue({ name: 'AC deep clean' });

    const res = (await handler(makeReq(), ctx)) as HttpResponseInit;

    expect(bookingRepo.getByCustomerId).toHaveBeenCalledWith('cust-1');
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      bookings: [
        {
          bookingId: 'bk-1',
          serviceId: 'ac-deep-clean',
          serviceName: 'AC deep clean',
          addressText: '101 Ayodhya',
          addressLatLng: { lat: 26.79, lng: 82.2 },
          status: 'ASSIGNED',
          slotDate: '2026-05-05',
          slotWindow: '10:00-12:00',
          amount: 99900,
          paymentMethod: 'CASH_ON_SERVICE',
          createdAt: '2026-05-03T10:00:00.000Z',
        },
      ],
    });
  });

  it('returns a structured 500 when customer booking lookup fails', async () => {
    const { bookingRepo } = await import('../../src/cosmos/booking-repository.js');
    (bookingRepo.getByCustomerId as MockFn).mockRejectedValue(new Error('Cosmos timeout'));

    const res = (await handler(makeReq(), ctx)) as HttpResponseInit;

    expect(res.status).toBe(500);
    expect(res.jsonBody).toEqual({ code: 'INTERNAL_ERROR' });
  });
});

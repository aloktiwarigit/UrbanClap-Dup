import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
  },
}));

vi.mock('../../../../src/cosmos/technician-repository.js', () => ({
  getTechnicianCandidatesForBooking: vi.fn(),
}));

import { bookingRepo } from '../../../../src/cosmos/booking-repository.js';
import { getTechnicianCandidatesForBooking } from '../../../../src/cosmos/technician-repository.js';
import { adminGetOrderTechnicianCandidatesHandler } from '../../../../src/functions/admin/orders/candidates.js';

const mockAdmin = { adminId: 'admin-1', role: 'ops-manager' as const, sessionId: 'sess-1' };
const mockCtx = {} as never;

function makeReq(id = 'bk-1'): HttpRequest {
  const req = new HttpRequest({ url: `http://localhost/api/v1/admin/orders/${id}/technician-candidates`, method: 'GET' });
  Object.assign(req, { params: { id } });
  return req;
}

describe('adminGetOrderTechnicianCandidatesHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns eligible technicians for the order area and service', async () => {
    const booking = {
      id: 'bk-1',
      customerId: 'cust-1',
      serviceId: 'ac-deep-clean',
      categoryId: 'ac-repair',
      slotDate: '2026-05-04',
      slotWindow: '10:00-11:00',
      addressText: 'Ayodhya',
      addressLatLng: { lat: 26.79, lng: 82.2 },
      status: 'UNFULFILLED',
      paymentOrderId: 'cash_1',
      paymentId: null,
      paymentSignature: null,
      amount: 59900,
      createdAt: '2026-05-04T00:00:00.000Z',
    };
    vi.mocked(bookingRepo.getById).mockResolvedValue(booking as never);
    vi.mocked(getTechnicianCandidatesForBooking).mockResolvedValue([
      {
        technicianId: 'tech-ayd-001',
        displayName: 'Ravi Kumar',
        distanceKm: 2.2,
        rating: 4.8,
        isOnline: true,
        isAvailable: true,
      },
    ]);

    const res = await adminGetOrderTechnicianCandidatesHandler(makeReq(), mockCtx, mockAdmin);

    expect(res.status).toBe(200);
    expect(getTechnicianCandidatesForBooking).toHaveBeenCalledWith(booking, 10);
    expect(res.jsonBody).toEqual({
      technicians: [
        expect.objectContaining({ technicianId: 'tech-ayd-001', displayName: 'Ravi Kumar' }),
      ],
    });
  });

  it('returns 404 when order is missing', async () => {
    vi.mocked(bookingRepo.getById).mockResolvedValue(null);

    const res = await adminGetOrderTechnicianCandidatesHandler(makeReq('missing'), mockCtx, mockAdmin);

    expect(res.status).toBe(404);
    expect(res.jsonBody).toEqual({ code: 'ORDER_NOT_FOUND' });
  });
});

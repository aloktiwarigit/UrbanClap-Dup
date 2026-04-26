import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getBookingsContainer: vi.fn(),
}));

import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { getBookingsContainer } from '../../../src/cosmos/client.js';
import type { BookingDoc } from '../../../src/schemas/booking.js';

const mockQueryFetchAll = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getBookingsContainer).mockReturnValue({
    items: {
      query: vi.fn().mockReturnValue({ fetchAll: mockQueryFetchAll }),
    },
  } as any);
});

const BASE: BookingDoc = {
  id: 'bk-1',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-04-25',
  slotWindow: '10:00-12:00',
  addressText: '100 MG Road',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'ASSIGNED',
  paymentOrderId: 'order-1',
  paymentId: 'pay-1',
  paymentSignature: 'sig-1',
  amount: 59900,
  createdAt: '2026-04-25T04:00:00.000Z',
};

describe('bookingRepo.getAssignedBookingsBefore', () => {
  it('queries with ASSIGNED status filter and slotDate cutoff', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [BASE] });

    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('bk-1');

    const queryCalls = vi.mocked(getBookingsContainer().items.query).mock.calls;
    const querySpec = queryCalls[0]![0] as any;
    expect(querySpec.query).toContain("c.status = 'ASSIGNED'");
    expect(querySpec.query).toContain('c.slotDate <= @slotDate');
    expect(querySpec.parameters).toContainEqual({ name: '@slotDate', value: '2026-04-25' });
  });

  it('returns empty array when no ASSIGNED bookings found', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [] });
    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');
    expect(result).toEqual([]);
  });
});

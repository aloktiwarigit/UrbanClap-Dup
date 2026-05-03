import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/cosmos/client.js', () => ({
  getBookingsContainer: vi.fn(),
}));

import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { getBookingsContainer } from '../../../src/cosmos/client.js';
import type { BookingDoc } from '../../../src/schemas/booking.js';

const mockQueryFetchAll = vi.fn();
const mockQuery = vi.fn().mockReturnValue({ fetchAll: mockQueryFetchAll });

beforeEach(() => {
  vi.resetAllMocks();
  mockQuery.mockReturnValue({ fetchAll: mockQueryFetchAll });
  vi.mocked(getBookingsContainer).mockReturnValue({
    items: { query: mockQuery },
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

describe('bookingRepo.getAssignedBookingsBefore (includes NO_SHOW_REDISPATCH)', () => {
  it('queries with ASSIGNED and NO_SHOW_REDISPATCH status filter and slotDate cutoff', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [BASE] });

    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('bk-1');

    const querySpec = mockQuery.mock.calls[0]![0] as { query: string; parameters: unknown[] };
    expect(querySpec.query).toContain("c.status IN ('ASSIGNED', 'NO_SHOW_REDISPATCH')");
    expect(querySpec.query).toContain('c.slotDate <= @slotDate');
    expect(querySpec.parameters).toContainEqual({ name: '@slotDate', value: '2026-04-25' });
  });

  it('returns empty array when no ASSIGNED bookings found', async () => {
    mockQueryFetchAll.mockResolvedValue({ resources: [] });
    const result = await bookingRepo.getAssignedBookingsBefore('2026-04-25');
    expect(result).toEqual([]);
  });
});

describe('bookingRepo.getByCustomerId', () => {
  it('queries customer bookings and orders them by scheduled slot in memory', async () => {
    const older = { ...BASE, id: 'bk-older', slotDate: '2026-05-01', slotWindow: '09:00-11:00', createdAt: '2026-04-25T04:00:00.000Z' };
    const newer = { ...BASE, id: 'bk-newer', slotDate: '2026-05-05', slotWindow: '10:00-12:00', createdAt: '2026-04-26T04:00:00.000Z' };
    mockQueryFetchAll.mockResolvedValue({ resources: [older, newer] });

    const result = await bookingRepo.getByCustomerId('cust-1');

    expect(result.map((booking) => booking.id)).toEqual(['bk-newer', 'bk-older']);
    const querySpec = mockQuery.mock.calls[0]![0] as { query: string; parameters: unknown[] };
    expect(querySpec.query).toContain('c.customerId = @customerId');
    expect(querySpec.query).not.toContain('ORDER BY');
    expect(querySpec.parameters).toContainEqual({ name: '@customerId', value: 'cust-1' });
  });
});

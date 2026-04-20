import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';

// --- Mocks ---
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));

vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: () => ({
    items: { query: mockQuery, create: vi.fn() },
    item: vi.fn(() => ({ read: vi.fn(), replace: vi.fn() })),
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { bookingRepo } from '../../src/cosmos/booking-repository.js';

const staleDoc: BookingDoc = {
  id: 'bk-stale-1',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'SEARCHING',
  paymentOrderId: 'order_stale',
  paymentId: 'pay_stale',
  paymentSignature: 'sig_stale',
  amount: 59900,
  createdAt: '2026-04-19T08:00:00.000Z',
};

describe('bookingRepo.getStaleSearching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries with correct SQL and @cutoff parameter', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });
    const cutoff = '2026-04-20T00:00:00.000Z';

    await bookingRepo.getStaleSearching(cutoff);

    expect(mockQuery).toHaveBeenCalledOnce();
    const queryArg: { query: string; parameters: Array<{ name: string; value: string }> } =
      mockQuery.mock.calls[0]![0]!;
    expect(queryArg.query).toContain("c.status = 'SEARCHING'");
    expect(queryArg.query).toContain('c.createdAt < @cutoff');
    expect(queryArg.parameters).toEqual([{ name: '@cutoff', value: cutoff }]);
  });

  it('returns array of matching documents', async () => {
    const cutoff = '2026-04-20T00:00:00.000Z';
    mockFetchAll.mockResolvedValue({ resources: [staleDoc] });

    const result = await bookingRepo.getStaleSearching(cutoff);

    expect(result).toEqual([staleDoc]);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no results', async () => {
    const cutoff = '2026-04-20T00:00:00.000Z';
    mockFetchAll.mockResolvedValue({ resources: [] });

    const result = await bookingRepo.getStaleSearching(cutoff);

    expect(result).toEqual([]);
  });
});

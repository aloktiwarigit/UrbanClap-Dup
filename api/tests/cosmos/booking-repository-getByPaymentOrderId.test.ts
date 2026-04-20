import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';

// --- Mocks ---
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));
const mockItem = vi.fn(() => ({ read: vi.fn() }));

vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: () => ({
    items: { query: mockQuery, create: vi.fn() },
    item: mockItem,
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { bookingRepo } from '../../src/cosmos/booking-repository.js';

const sampleDoc: BookingDoc = {
  id: 'bk-order-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'PENDING_PAYMENT',
  paymentOrderId: 'order_abc123',
  paymentId: null,
  paymentSignature: null,
  amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('bookingRepo.getByPaymentOrderId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries Cosmos with the correct SQL and parameter', async () => {
    mockFetchAll.mockResolvedValue({ resources: [sampleDoc] });

    await bookingRepo.getByPaymentOrderId('order_abc123');

    expect(mockQuery).toHaveBeenCalledOnce();
    const queryArg: { query: string; parameters: Array<{ name: string; value: string }> } =
      mockQuery.mock.calls[0]![0]!;
    expect(queryArg.query).toContain('c.paymentOrderId = @orderId');
    expect(queryArg.parameters).toEqual([{ name: '@orderId', value: 'order_abc123' }]);
  });

  it('returns the first matching document when found', async () => {
    mockFetchAll.mockResolvedValue({ resources: [sampleDoc] });

    const result = await bookingRepo.getByPaymentOrderId('order_abc123');

    expect(result).toEqual(sampleDoc);
  });

  it('returns null when no documents match', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    const result = await bookingRepo.getByPaymentOrderId('order_nonexistent');

    expect(result).toBeNull();
  });

  it('returns the first document when multiple match (dedup handled by caller)', async () => {
    const secondDoc: BookingDoc = { ...sampleDoc, id: 'bk-order-test-2' };
    mockFetchAll.mockResolvedValue({ resources: [sampleDoc, secondDoc] });

    const result = await bookingRepo.getByPaymentOrderId('order_abc123');

    expect(result?.id).toBe('bk-order-test');
  });
});

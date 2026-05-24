import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';

// --- Mocks ---
const mockReplace = vi.fn();
const mockRead = vi.fn();
const mockItem = vi.fn(() => ({ read: mockRead, replace: mockReplace }));

vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: () => ({
    items: { query: vi.fn(() => ({ fetchAll: vi.fn() })), create: vi.fn() },
    item: mockItem,
  }),
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { bookingRepo } from '../../src/cosmos/booking-repository.js';

const baseDoc: BookingDoc = {
  id: 'bk-cash-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'COMPLETED',
  paymentOrderId: 'order_cash123',
  paymentId: null,
  paymentSignature: null,
  paymentMethod: 'CASH_ON_SERVICE',
  cashCollectionStatus: 'PENDING',
  amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('bookingRepo.markCashCollected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });

    const result = await bookingRepo.markCashCollected('nonexistent-id', 500);

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('transitions PENDING → COLLECTED with timestamp and amount', async () => {
    const pendingDoc: BookingDoc = { ...baseDoc, cashCollectionStatus: 'PENDING' };
    const updatedDoc: BookingDoc = {
      ...pendingDoc,
      cashCollectionStatus: 'COLLECTED',
      cashCollectedAt: '2026-05-24T10:00:00.000Z',
      cashCollectedAmount: 59900,
    };
    mockRead.mockResolvedValue({ resource: pendingDoc, etag: 'etag-abc' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.markCashCollected('bk-cash-test', 59900);

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.cashCollectionStatus).toBe('COLLECTED');
    expect(replaceArg.cashCollectedAt).toBeDefined();
    expect(typeof replaceArg.cashCollectedAt).toBe('string');
    expect(replaceArg.cashCollectedAmount).toBe(59900);
    expect(result).toEqual(updatedDoc);
  });

  it('is idempotent — returns existing doc unchanged when already COLLECTED', async () => {
    const collectedDoc: BookingDoc = {
      ...baseDoc,
      cashCollectionStatus: 'COLLECTED',
      cashCollectedAt: '2026-05-23T09:00:00.000Z',
      cashCollectedAmount: 59900,
    };
    mockRead.mockResolvedValue({ resource: collectedDoc, etag: 'etag-xyz' });

    const result = await bookingRepo.markCashCollected('bk-cash-test', 59900);

    expect(result).toEqual(collectedDoc);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('omits cashCollectedAmount when amount is not provided', async () => {
    const pendingDoc: BookingDoc = { ...baseDoc, cashCollectionStatus: 'PENDING' };
    const updatedDoc: BookingDoc = {
      ...pendingDoc,
      cashCollectionStatus: 'COLLECTED',
      cashCollectedAt: '2026-05-24T10:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: pendingDoc, etag: 'etag-abc' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.markCashCollected('bk-cash-test');

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.cashCollectionStatus).toBe('COLLECTED');
    expect(replaceArg.cashCollectedAt).toBeDefined();
    expect('cashCollectedAmount' in replaceArg).toBe(false);
    expect(result).toEqual(updatedDoc);
  });
});

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
  id: 'bk-paid-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 12.97, lng: 77.59 },
  status: 'SEARCHING',
  paymentOrderId: 'order_abc123',
  paymentId: 'pay_existing',
  paymentSignature: 'sig_existing',
  amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('bookingRepo.markPaid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await bookingRepo.markPaid('nonexistent-id', 'pay_xyz');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when status is not SEARCHING (e.g. PENDING_PAYMENT)', async () => {
    const pendingDoc: BookingDoc = { ...baseDoc, status: 'PENDING_PAYMENT' };
    mockRead.mockResolvedValue({ resource: pendingDoc });

    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_xyz');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('transitions SEARCHING → PAID and writes paymentId', async () => {
    const searchingDoc: BookingDoc = { ...baseDoc, status: 'SEARCHING' };
    const updatedDoc: BookingDoc = { ...searchingDoc, status: 'PAID', paymentId: 'pay_new' };
    mockRead.mockResolvedValue({ resource: searchingDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_new');

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg: BookingDoc = mockReplace.mock.calls[0]![0]!;
    expect(replaceArg.status).toBe('PAID');
    expect(replaceArg.paymentId).toBe('pay_new');
    expect(result).toEqual(updatedDoc);
  });

  it('returns null when status is already PAID (idempotency guard)', async () => {
    const paidDoc: BookingDoc = { ...baseDoc, status: 'PAID' };
    mockRead.mockResolvedValue({ resource: paidDoc });

    const result = await bookingRepo.markPaid('bk-paid-test', 'pay_xyz');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';

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
  id: 'bk-confirm-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  status: 'PENDING_PAYMENT',
  paymentOrderId: 'order_abc',
  paymentId: null,
  paymentSignature: null,
  amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('bookingRepo.confirmPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PENDING_PAYMENT → SEARCHING with paymentId and paymentSignature written', async () => {
    const pendingDoc: BookingDoc = { ...baseDoc, status: 'PENDING_PAYMENT' };
    const updatedDoc: BookingDoc = { ...pendingDoc, status: 'SEARCHING', paymentId: 'pay_new', paymentSignature: 'sig_new' };
    mockRead.mockResolvedValue({ resource: pendingDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.confirmPayment('bk-confirm-test', 'pay_new', 'sig_new');

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.status).toBe('SEARCHING');
    expect(replaceArg.paymentId).toBe('pay_new');
    expect(replaceArg.paymentSignature).toBe('sig_new');
    expect(result).toEqual(updatedDoc);
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await bookingRepo.confirmPayment('nonexistent', 'pay_new', 'sig_new');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns existing PAID doc without writing — idempotent when webhook already processed', async () => {
    const paidDoc: BookingDoc = { ...baseDoc, status: 'PAID', paymentId: 'pay_webhook', paymentSignature: 'sig_wh' };
    mockRead.mockResolvedValue({ resource: paidDoc });

    const result = await bookingRepo.confirmPayment('bk-confirm-test', 'pay_client', 'sig_client');

    expect(result).toEqual(paidDoc);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('throws when Cosmos replace rejects — no optimistic-concurrency guard in confirmPayment', async () => {
    // NOTE: confirmPayment does not use ETag conditional writes. A 412 or any replace error
    // surfaces as a thrown exception rather than returning null. This test pins current behavior.
    const pendingDoc: BookingDoc = { ...baseDoc, status: 'PENDING_PAYMENT' };
    mockRead.mockResolvedValue({ resource: pendingDoc });
    mockReplace.mockRejectedValue(Object.assign(new Error('Precondition failed'), { statusCode: 412 }));

    await expect(bookingRepo.confirmPayment('bk-confirm-test', 'pay_new', 'sig_new')).rejects.toThrow();
    expect(mockReplace).toHaveBeenCalledOnce();
  });
});

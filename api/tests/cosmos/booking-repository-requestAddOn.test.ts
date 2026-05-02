import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';
import type { PendingAddOn } from '../../src/schemas/addon-approval.js';

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
  id: 'bk-addon-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  status: 'IN_PROGRESS',
  paymentOrderId: 'order_abc',
  paymentId: 'pay_existing',
  paymentSignature: 'sig_existing',
  amount: 59900,
  createdAt: '2026-04-20T10:00:00.000Z',
};

const addOn1: PendingAddOn = { name: 'caulking', price: 500, triggerDescription: 'Worn caulk on pipes' };
const addOn2: PendingAddOn = { name: 'pipe_replace', price: 1500, triggerDescription: 'Cracked pipe section' };

describe('bookingRepo.requestAddOn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('IN_PROGRESS → AWAITING_PRICE_APPROVAL with addOn appended to pendingAddOns', async () => {
    const inProgressDoc: BookingDoc = { ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [] };
    const updatedDoc: BookingDoc = { ...inProgressDoc, status: 'AWAITING_PRICE_APPROVAL', pendingAddOns: [addOn1] };
    mockRead.mockResolvedValue({ resource: inProgressDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.requestAddOn('bk-addon-test', addOn1);

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.status).toBe('AWAITING_PRICE_APPROVAL');
    expect(replaceArg.pendingAddOns).toHaveLength(1);
    expect(replaceArg.pendingAddOns![0]).toEqual(addOn1);
    expect(result).toEqual(updatedDoc);
  });

  it('returns null when booking is not in IN_PROGRESS status', async () => {
    const waitingDoc: BookingDoc = { ...baseDoc, status: 'AWAITING_PRICE_APPROVAL' };
    mockRead.mockResolvedValue({ resource: waitingDoc });

    const result = await bookingRepo.requestAddOn('bk-addon-test', addOn1);

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('two sequential calls accumulate two items in pendingAddOns', async () => {
    // First call: IN_PROGRESS + empty pendingAddOns → AWAITING_PRICE_APPROVAL + [addOn1]
    const firstCallInput: BookingDoc = { ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [] };
    const firstCallResult: BookingDoc = { ...firstCallInput, status: 'AWAITING_PRICE_APPROVAL', pendingAddOns: [addOn1] };
    // Second call simulates the persisted result being back IN_PROGRESS with addOn1 already there
    // (e.g. applyAddOnDecisions reverted to IN_PROGRESS, retaining approved addOns separately)
    const secondCallInput: BookingDoc = { ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [addOn1] };
    const secondCallResult: BookingDoc = { ...secondCallInput, status: 'AWAITING_PRICE_APPROVAL', pendingAddOns: [addOn1, addOn2] };

    mockRead
      .mockResolvedValueOnce({ resource: firstCallInput })
      .mockResolvedValueOnce({ resource: secondCallInput });
    mockReplace
      .mockResolvedValueOnce({ resource: firstCallResult })
      .mockResolvedValueOnce({ resource: secondCallResult });

    const first = await bookingRepo.requestAddOn('bk-addon-test', addOn1);
    const second = await bookingRepo.requestAddOn('bk-addon-test', addOn2);

    expect(first!.pendingAddOns).toHaveLength(1);
    expect(second!.pendingAddOns).toHaveLength(2);
    expect(second!.pendingAddOns).toEqual([addOn1, addOn2]);
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await bookingRepo.requestAddOn('nonexistent', addOn1);

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('throws when Cosmos replace rejects — no optimistic-concurrency guard in requestAddOn', async () => {
    // NOTE: requestAddOn does not use ETag conditional writes. Replace errors surface as thrown
    // exceptions. This test pins current behavior.
    const inProgressDoc: BookingDoc = { ...baseDoc, status: 'IN_PROGRESS' };
    mockRead.mockResolvedValue({ resource: inProgressDoc });
    mockReplace.mockRejectedValue(Object.assign(new Error('Precondition failed'), { statusCode: 412 }));

    await expect(bookingRepo.requestAddOn('bk-addon-test', addOn1)).rejects.toThrow();
    expect(mockReplace).toHaveBeenCalledOnce();
  });
});

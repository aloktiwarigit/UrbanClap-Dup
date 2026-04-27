import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingDoc } from '../../src/schemas/booking.js';
import type { PendingAddOn, AddOnDecision } from '../../src/schemas/addon-approval.js';

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

const pending: PendingAddOn[] = [
  { name: 'caulking', price: 500, triggerDescription: 'Worn caulk' },
  { name: 'pipe_replace', price: 1500, triggerDescription: 'Cracked pipe' },
  { name: 'valve', price: 800, triggerDescription: 'Faulty valve' },
];

const baseDoc: BookingDoc = {
  id: 'bk-apply-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '123 Main St',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  status: 'AWAITING_PRICE_APPROVAL',
  paymentOrderId: 'order_abc',
  paymentId: 'pay_existing',
  paymentSignature: 'sig_existing',
  amount: 10000,
  pendingAddOns: pending,
  createdAt: '2026-04-20T10:00:00.000Z',
};

describe('bookingRepo.applyAddOnDecisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('2 approvals + 1 rejection → finalAmount = base + sum(approved only)', async () => {
    const decisions: AddOnDecision[] = [
      { name: 'caulking', approved: true },
      { name: 'pipe_replace', approved: false },
      { name: 'valve', approved: true },
    ];
    const updatedDoc: BookingDoc = {
      ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [],
      approvedAddOns: [pending[0]!, pending[2]!],
      finalAmount: 10000 + 500 + 800, // caulking + valve only
    };
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.applyAddOnDecisions('bk-apply-test', 'cust-1', decisions);

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.finalAmount).toBe(11300);
    expect(replaceArg.status).toBe('IN_PROGRESS');
    expect(replaceArg.pendingAddOns).toEqual([]);
    expect(result).toEqual(updatedDoc);
  });

  it('regression-catch: rejected addOn excluded from finalAmount — catches "summed all pendingAddOns including rejected" overcharge', async () => {
    // If the implementation sums ALL pendingAddOns instead of only approved ones,
    // finalAmount would be 10000 + 500 + 1500 + 800 = 12800 (wrong).
    // Correct: 10000 + 500 + 800 = 11300 (approved only).
    const decisions: AddOnDecision[] = [
      { name: 'caulking', approved: true },
      { name: 'pipe_replace', approved: false },
      { name: 'valve', approved: true },
    ];
    const updatedDoc: BookingDoc = {
      ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [],
      approvedAddOns: [pending[0]!, pending[2]!],
      finalAmount: 11300,
    };
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    await bookingRepo.applyAddOnDecisions('bk-apply-test', 'cust-1', decisions);

    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.finalAmount).not.toBe(12800);
    expect(replaceArg.finalAmount).toBe(11300);
  });

  it('returns null when customerId does not match booking owner', async () => {
    mockRead.mockResolvedValue({ resource: baseDoc });

    const result = await bookingRepo.applyAddOnDecisions(
      'bk-apply-test', 'wrong-customer', [{ name: 'caulking', approved: true }],
    );

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when booking is not in AWAITING_PRICE_APPROVAL status', async () => {
    const inProgressDoc: BookingDoc = { ...baseDoc, status: 'IN_PROGRESS' };
    mockRead.mockResolvedValue({ resource: inProgressDoc });

    const result = await bookingRepo.applyAddOnDecisions(
      'bk-apply-test', 'cust-1', [{ name: 'caulking', approved: true }],
    );

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('all rejected → finalAmount equals original amount (no price increase)', async () => {
    const decisions: AddOnDecision[] = [
      { name: 'caulking', approved: false },
      { name: 'pipe_replace', approved: false },
      { name: 'valve', approved: false },
    ];
    const updatedDoc: BookingDoc = {
      ...baseDoc, status: 'IN_PROGRESS', pendingAddOns: [],
      approvedAddOns: [],
      finalAmount: 10000,
    };
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.applyAddOnDecisions('bk-apply-test', 'cust-1', decisions);

    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.finalAmount).toBe(10000);
    expect(result!.approvedAddOns).toEqual([]);
  });

  it('throws when Cosmos replace rejects — no optimistic-concurrency guard in applyAddOnDecisions', async () => {
    // NOTE: applyAddOnDecisions does not use ETag conditional writes. Replace errors propagate
    // as thrown exceptions rather than returning null. This test pins current behavior.
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockRejectedValue(Object.assign(new Error('Precondition failed'), { statusCode: 412 }));

    await expect(
      bookingRepo.applyAddOnDecisions('bk-apply-test', 'cust-1', [{ name: 'caulking', approved: true }]),
    ).rejects.toThrow();
    expect(mockReplace).toHaveBeenCalledOnce();
  });
});

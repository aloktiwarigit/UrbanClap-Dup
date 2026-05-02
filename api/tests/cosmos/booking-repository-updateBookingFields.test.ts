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

import { updateBookingFields } from '../../src/cosmos/booking-repository.js';

const baseDoc: BookingDoc = {
  id: 'bk-fields-test',
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

describe('updateBookingFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('arbitrary non-status field update → status field unchanged in the write', async () => {
    const updatedDoc: BookingDoc = { ...baseDoc, internalNotes: ['technician arrived late'] };
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await updateBookingFields('bk-fields-test', { internalNotes: ['technician arrived late'] });

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.status).toBe('IN_PROGRESS');
    expect(replaceArg.internalNotes).toEqual(['technician arrived late']);
    expect(result).toEqual(updatedDoc);
  });

  it('caller passes status field → write succeeds with new status (pinning current behavior; may be surprising)', async () => {
    // NOTE: updateBookingFields spreads the fields argument directly, including `status`.
    // This means callers can inadvertently overwrite the status field. This test pins current
    // behavior — do NOT fix here; file a separate issue if this is unintended.
    const updatedDoc: BookingDoc = { ...baseDoc, status: 'COMPLETED' };
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await updateBookingFields('bk-fields-test', { status: 'COMPLETED' });

    const replaceArg = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceArg.status).toBe('COMPLETED');
    expect(result!.status).toBe('COMPLETED');
  });

  it('throws when Cosmos replace rejects — no optimistic-concurrency guard in updateBookingFields', async () => {
    // NOTE: updateBookingFields does not use ETag. Replace errors surface as thrown exceptions.
    mockRead.mockResolvedValue({ resource: baseDoc });
    mockReplace.mockRejectedValue(Object.assign(new Error('Precondition failed'), { statusCode: 412 }));

    await expect(updateBookingFields('bk-fields-test', { internalNotes: ['note'] })).rejects.toThrow();
    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await updateBookingFields('nonexistent', { internalNotes: ['note'] });

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

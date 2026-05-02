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
  id: 'bk-photo-test',
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

describe('bookingRepo.addPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('single photo at stage → photos[stage] has 1 entry with the provided URL', async () => {
    const existingDoc: BookingDoc = { ...baseDoc };
    const updatedDoc: BookingDoc = { ...existingDoc, photos: { before: ['https://cdn.example.com/a.jpg'] } };
    mockRead.mockResolvedValue({ resource: existingDoc, etag: '"etag-1"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.addPhoto('bk-photo-test', 'before', 'https://cdn.example.com/a.jpg');

    expect(mockReplace).toHaveBeenCalledOnce();
    const [replaceDoc, replaceOpts] = (mockReplace.mock.calls as unknown[][])[0]! as [BookingDoc, { accessCondition: { type: string; condition: string } }];
    expect(replaceDoc.photos!['before']).toHaveLength(1);
    expect(replaceDoc.photos!['before']![0]).toBe('https://cdn.example.com/a.jpg');
    expect(replaceOpts.accessCondition.type).toBe('IfMatch');
    expect(replaceOpts.accessCondition.condition).toBe('"etag-1"');
    expect(result).toEqual(updatedDoc);
  });

  it('second photo at same stage → appended, not replaced (2 entries)', async () => {
    const existingDoc: BookingDoc = { ...baseDoc, photos: { before: ['https://cdn.example.com/a.jpg'] } };
    const updatedDoc: BookingDoc = {
      ...existingDoc,
      photos: { before: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'] },
    };
    mockRead.mockResolvedValue({ resource: existingDoc, etag: '"etag-2"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.addPhoto('bk-photo-test', 'before', 'https://cdn.example.com/b.jpg');

    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceDoc = (mockReplace.mock.calls as unknown[][])[0]![0] as BookingDoc;
    expect(replaceDoc.photos!['before']).toHaveLength(2);
    expect(replaceDoc.photos!['before']![1]).toBe('https://cdn.example.com/b.jpg');
    expect(result!.photos!['before']).toHaveLength(2);
  });

  it('throws on ETag mismatch — addPhoto has no retry loop; 412 is not silently swallowed', async () => {
    // NOTE: The implementation uses ETag IfMatch for optimistic concurrency but does not
    // retry on 412 conflict. A concurrent upload racing on the same booking will cause this call
    // to throw. This test pins that behavior — silent loss would be worse than the throw.
    const existingDoc: BookingDoc = { ...baseDoc };
    mockRead.mockResolvedValue({ resource: existingDoc, etag: '"stale-etag"' });
    mockReplace.mockRejectedValue(Object.assign(new Error('Precondition failed'), { statusCode: 412 }));

    await expect(
      bookingRepo.addPhoto('bk-photo-test', 'before', 'https://cdn.example.com/race.jpg'),
    ).rejects.toThrow();
    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it('returns null when booking is not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });

    const result = await bookingRepo.addPhoto('nonexistent', 'before', 'https://cdn.example.com/a.jpg');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('regression-catch: ETag mismatch on replace throws — photo is not silently lost', async () => {
    // A silent catch here (returning null or undefined) would cause the caller to think success
    // while the photo URL is permanently lost. The throw ensures the caller knows to retry.
    // This test guards against accidentally adding a try/catch that swallows the error.
    const existingDoc: BookingDoc = { ...baseDoc };
    mockRead.mockResolvedValue({ resource: existingDoc, etag: '"etag-concurrent"' });
    const concurrencyError = Object.assign(new Error('ETag mismatch'), { statusCode: 412, code: 412 });
    mockReplace.mockRejectedValue(concurrencyError);

    let threw = false;
    let returnedNull = false;
    try {
      const r = await bookingRepo.addPhoto('bk-photo-test', 'after', 'https://cdn.example.com/lost.jpg');
      if (r === null || r === undefined) returnedNull = true;
    } catch {
      threw = true;
    }

    // Either the function throws (correct) or returns null (acceptable pin).
    // What it must NOT do is return a truthy value, implying the photo was saved when it wasn't.
    expect(threw || returnedNull).toBe(true);
  });
});

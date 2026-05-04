/**
 * ETag guard tests for bookingRepo.confirmPayment and bookingRepo.markPaid
 *
 * Tests the BOOKINGS_ETAG_GUARDS=on path introduced in E12-S01:
 *  - 412 Precondition Failed from Cosmos → returns null (idempotent by design)
 *  - already-PAID idempotent guard still fires BEFORE replace attempt
 *  - flag-off path falls through to the original unconditional replace
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const BASE: BookingDoc = {
  id: 'bk-etag-test',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-05-01',
  slotWindow: '10:00-12:00',
  addressText: '1 Main St',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  status: 'PENDING_PAYMENT',
  paymentOrderId: 'order_etag',
  paymentId: null,
  paymentSignature: null,
  amount: 59900,
  createdAt: '2026-05-01T10:00:00.000Z',
};

// ────────────────────────────────────────────────────────────────────────────
// confirmPayment — ETag ON
// ────────────────────────────────────────────────────────────────────────────
describe('bookingRepo.confirmPayment — BOOKINGS_ETAG_GUARDS=on', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BOOKINGS_ETAG_GUARDS', 'on');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('succeeds: replaces with IfMatch accessCondition and returns updated doc', async () => {
    const pendingDoc: BookingDoc = { ...BASE, status: 'PENDING_PAYMENT' };
    const updatedDoc: BookingDoc = { ...pendingDoc, status: 'SEARCHING', paymentId: 'pay_etag', paymentSignature: 'sig_etag' };

    mockRead.mockResolvedValue({ resource: pendingDoc, etag: '"etag-abc"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.confirmPayment('bk-etag-test', 'pay_etag', 'sig_etag');

    expect(result).toEqual(updatedDoc);
    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceOpts = (mockReplace.mock.calls as unknown[][])[0]![1] as Record<string, unknown>;
    expect(replaceOpts).toMatchObject({
      accessCondition: { type: 'IfMatch', condition: '"etag-abc"' },
    });
  });

  it('returns null on 412 Precondition Failed — idempotent ETag race', async () => {
    const pendingDoc: BookingDoc = { ...BASE, status: 'PENDING_PAYMENT' };
    mockRead.mockResolvedValue({ resource: pendingDoc, etag: '"etag-stale"' });
    const cosmosError = Object.assign(new Error('Precondition Failed'), { code: 412 });
    mockReplace.mockRejectedValue(cosmosError);

    const result = await bookingRepo.confirmPayment('bk-etag-test', 'pay_etag', 'sig_etag');

    expect(result).toBeNull();
  });

  it('propagates non-412 errors from Cosmos', async () => {
    const pendingDoc: BookingDoc = { ...BASE, status: 'PENDING_PAYMENT' };
    mockRead.mockResolvedValue({ resource: pendingDoc, etag: '"etag-abc"' });
    mockReplace.mockRejectedValue(new Error('500 Service Unavailable'));

    await expect(bookingRepo.confirmPayment('bk-etag-test', 'pay_etag', 'sig_etag')).rejects.toThrow('500 Service Unavailable');
  });

  it('idempotent-success guard: returns existing PAID doc without replace even with ETag on', async () => {
    const paidDoc: BookingDoc = { ...BASE, status: 'PAID', paymentId: 'pay_webhook', paymentSignature: 'sig_wh' };
    mockRead.mockResolvedValue({ resource: paidDoc, etag: '"etag-paid"' });

    const result = await bookingRepo.confirmPayment('bk-etag-test', 'pay_client', 'sig_client');

    expect(result).toEqual(paidDoc);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// confirmPayment — ETag OFF (flag=off, legacy path)
// ────────────────────────────────────────────────────────────────────────────
describe('bookingRepo.confirmPayment — BOOKINGS_ETAG_GUARDS=off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BOOKINGS_ETAG_GUARDS', 'off');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('still transitions PENDING_PAYMENT → SEARCHING via unconditional replace', async () => {
    const pendingDoc: BookingDoc = { ...BASE, status: 'PENDING_PAYMENT' };
    const updatedDoc: BookingDoc = { ...pendingDoc, status: 'SEARCHING', paymentId: 'pay_legacy', paymentSignature: 'sig_legacy' };
    mockRead.mockResolvedValue({ resource: pendingDoc, etag: '"etag-xyz"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.confirmPayment('bk-etag-test', 'pay_legacy', 'sig_legacy');

    expect(result).toEqual(updatedDoc);
    expect(mockReplace).toHaveBeenCalledOnce();
    // Legacy path should NOT include accessCondition
    const replaceOpts = (mockReplace.mock.calls as unknown[][])[0]?.[1];
    expect(replaceOpts).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// markPaid — ETag ON
// ────────────────────────────────────────────────────────────────────────────
describe('bookingRepo.markPaid — BOOKINGS_ETAG_GUARDS=on', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BOOKINGS_ETAG_GUARDS', 'on');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('succeeds: replaces with IfMatch accessCondition and returns updated doc', async () => {
    const searchingDoc: BookingDoc = { ...BASE, status: 'SEARCHING', paymentId: 'pay_existing', paymentSignature: 'sig_existing' };
    const updatedDoc: BookingDoc = { ...searchingDoc, status: 'PAID', paymentId: 'pay_webhook' };
    mockRead.mockResolvedValue({ resource: searchingDoc, etag: '"etag-search"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.markPaid('bk-etag-test', 'pay_webhook');

    expect(result).toEqual(updatedDoc);
    expect(mockReplace).toHaveBeenCalledOnce();
    const replaceOpts = (mockReplace.mock.calls as unknown[][])[0]![1] as Record<string, unknown>;
    expect(replaceOpts).toMatchObject({
      accessCondition: { type: 'IfMatch', condition: '"etag-search"' },
    });
  });

  it('returns null on 412 Precondition Failed — idempotent ETag race', async () => {
    const searchingDoc: BookingDoc = { ...BASE, status: 'SEARCHING', paymentId: null, paymentSignature: null };
    mockRead.mockResolvedValue({ resource: searchingDoc, etag: '"etag-stale"' });
    const cosmosError = Object.assign(new Error('Precondition Failed'), { code: 412 });
    mockReplace.mockRejectedValue(cosmosError);

    const result = await bookingRepo.markPaid('bk-etag-test', 'pay_webhook');

    expect(result).toBeNull();
  });

  it('propagates non-412 errors from Cosmos', async () => {
    const searchingDoc: BookingDoc = { ...BASE, status: 'SEARCHING', paymentId: null, paymentSignature: null };
    mockRead.mockResolvedValue({ resource: searchingDoc, etag: '"etag-abc"' });
    mockReplace.mockRejectedValue(new Error('429 Too Many Requests'));

    await expect(bookingRepo.markPaid('bk-etag-test', 'pay_webhook')).rejects.toThrow('429 Too Many Requests');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// markPaid — ETag OFF (flag=off, legacy path)
// ────────────────────────────────────────────────────────────────────────────
describe('bookingRepo.markPaid — BOOKINGS_ETAG_GUARDS=off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BOOKINGS_ETAG_GUARDS', 'off');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('transitions SEARCHING → PAID via unconditional replace', async () => {
    const searchingDoc: BookingDoc = { ...BASE, status: 'SEARCHING', paymentId: 'pay_prev', paymentSignature: 'sig_prev' };
    const updatedDoc: BookingDoc = { ...searchingDoc, status: 'PAID', paymentId: 'pay_legacy' };
    mockRead.mockResolvedValue({ resource: searchingDoc, etag: '"etag-legacy"' });
    mockReplace.mockResolvedValue({ resource: updatedDoc });

    const result = await bookingRepo.markPaid('bk-etag-test', 'pay_legacy');

    expect(result).toEqual(updatedDoc);
    expect(mockReplace).toHaveBeenCalledOnce();
    // Legacy path should NOT include accessCondition
    const replaceOpts = (mockReplace.mock.calls as unknown[][])[0]?.[1];
    expect(replaceOpts).toBeUndefined();
  });
});

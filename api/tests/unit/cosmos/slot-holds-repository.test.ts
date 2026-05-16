import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before module import
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();
const mockPatch = vi.fn();
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));
const mockItem = vi.fn(() => ({ patch: mockPatch }));

vi.mock('../../../src/cosmos/client.js', () => ({
  getSlotHoldsContainer: vi.fn(() => ({
    items: { create: mockCreate, query: mockQuery },
    item: mockItem,
  })),
}));

import { slotHoldsRepo } from '../../../src/cosmos/slot-holds-repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SVC = 'svc-ac';
const DATE = '2026-05-20';
const WINDOW = '10:00-11:00';
const CUST = 'cust-1';
const HOLD_ID = `${SVC}|${DATE}|${WINDOW}`;
const HOLD_PK = `${SVC}|${DATE}`;

const HOLD_DOC = {
  id: HOLD_ID,
  servicePartitionKey: HOLD_PK,
  serviceId: SVC,
  date: DATE,
  window: WINDOW,
  customerId: CUST,
  heldAt: '2026-05-20T04:30:00.000Z',
};

// ---------------------------------------------------------------------------
// createHold
// ---------------------------------------------------------------------------

describe('slotHoldsRepo.createHold', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: returns hold doc when Cosmos create succeeds', async () => {
    mockCreate.mockResolvedValue({ resource: HOLD_DOC });

    const result = await slotHoldsRepo.createHold(SVC, DATE, WINDOW, CUST);

    expect(result).not.toBe('CONFLICT');
    expect((result as typeof HOLD_DOC).id).toBe(HOLD_ID);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('returns CONFLICT when Cosmos responds 409 (slot already held)', async () => {
    mockCreate.mockRejectedValue({ statusCode: 409 });

    const result = await slotHoldsRepo.createHold(SVC, DATE, WINDOW, CUST);

    expect(result).toBe('CONFLICT');
  });

  it('returns CONFLICT when Cosmos responds 412 (etag mismatch — ADR-0017 pattern)', async () => {
    mockCreate.mockRejectedValue({ statusCode: 412 });

    const result = await slotHoldsRepo.createHold(SVC, DATE, WINDOW, CUST);

    expect(result).toBe('CONFLICT');
  });

  it('rethrows non-409/412 errors for Sentry to capture upstream', async () => {
    mockCreate.mockRejectedValue({ statusCode: 500, message: 'Internal error' });

    await expect(slotHoldsRepo.createHold(SVC, DATE, WINDOW, CUST)).rejects.toMatchObject({ statusCode: 500 });
  });
});

// ---------------------------------------------------------------------------
// commitHold
// ---------------------------------------------------------------------------

describe('slotHoldsRepo.commitHold', () => {
  beforeEach(() => vi.clearAllMocks());

  it('happy path: patches bookingId and ttl=-1', async () => {
    mockPatch.mockResolvedValue({ resource: { ...HOLD_DOC, bookingId: 'bk-1', ttl: -1 } });

    await expect(slotHoldsRepo.commitHold(HOLD_ID, HOLD_PK, 'bk-1')).resolves.toBeUndefined();

    expect(mockItem).toHaveBeenCalledWith(HOLD_ID, HOLD_PK);
    expect(mockPatch).toHaveBeenCalledWith([
      { op: 'add', path: '/bookingId', value: 'bk-1' },
      { op: 'replace', path: '/ttl', value: -1 },
    ]);
  });

  it('silently returns when hold has already expired (Cosmos 404)', async () => {
    mockPatch.mockRejectedValue({ statusCode: 404 });

    // Should NOT throw — expired hold is non-fatal
    await expect(slotHoldsRepo.commitHold(HOLD_ID, HOLD_PK, 'bk-1')).resolves.toBeUndefined();
  });

  it('rethrows non-404 errors', async () => {
    mockPatch.mockRejectedValue({ statusCode: 503 });

    await expect(slotHoldsRepo.commitHold(HOLD_ID, HOLD_PK, 'bk-1')).rejects.toMatchObject({ statusCode: 503 });
  });
});

// ---------------------------------------------------------------------------
// listHolds
// ---------------------------------------------------------------------------

describe('slotHoldsRepo.listHolds', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns active hold docs for the given serviceId + date partition', async () => {
    mockFetchAll.mockResolvedValue({ resources: [HOLD_DOC] });

    const result = await slotHoldsRepo.listHolds(SVC, DATE);

    expect(result).toHaveLength(1);
    expect(result[0]!.window).toBe(WINDOW);
    // Verify it queries on the composite partition key
    const rawCall = mockQuery.mock.calls[0];
    const callArg = (rawCall as unknown as [{ query: string; parameters: { name: string; value: string }[] }])[0]!;
    expect(callArg.parameters[0]!.value).toBe(HOLD_PK);
  });

  it('returns empty array when no active holds exist', async () => {
    mockFetchAll.mockResolvedValue({ resources: [] });

    const result = await slotHoldsRepo.listHolds(SVC, DATE);

    expect(result).toEqual([]);
  });
});

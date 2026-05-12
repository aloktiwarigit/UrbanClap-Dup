/**
 * E13-S01 — Unit tests for customer-credit-ledger-repository
 *
 * Covers Codex P1 financial-correctness fixes:
 *   P1-1: Cross-partition query (container partitioned by /id, not /customerId)
 *   P1-2: Legacy no-show credit doc shape normalization (amount → amountInPaise)
 *   P1-3: Idempotency replay tied to bookingId (different bookingId → 409)
 *   P1-4: ETag-based optimistic concurrency on sentinel doc (prevent double-debit)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLedgerItems = { query: vi.fn(), create: vi.fn() };
const mockLedgerItem = vi.fn();
const mockIdempotencyItems = { create: vi.fn() };
const mockIdempotencyItem = vi.fn();

vi.mock('../../../src/cosmos/client.js', () => ({
  getCustomerCreditLedgerContainer: vi.fn(() => ({
    items: mockLedgerItems,
    item: mockLedgerItem,
  })),
  getAppliedCreditIdempotencyContainer: vi.fn(() => ({
    items: mockIdempotencyItems,
    item: mockIdempotencyItem,
  })),
}));

import { customerCreditLedgerRepo } from '../../../src/cosmos/customer-credit-ledger-repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a mock QueryIterator that resolves with the given resources. */
function mockQuery(resources: unknown[]) {
  return { fetchAll: vi.fn().mockResolvedValue({ resources }) };
}

// ---------------------------------------------------------------------------
// P1-1: Cross-partition query (no partitionKey in query options)
// ---------------------------------------------------------------------------

describe('P1-1: getBalance uses cross-partition query', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('fetches all docs WITHOUT a partitionKey restriction so no-show credits are included', async () => {
    // Setup: two docs — one new-format CREDIT_ISSUED, one legacy no-show
    const legacyNoShow = {
      id: 'bk-99',
      customerId: 'cust-1',
      bookingId: 'bk-99',
      amount: 50000, // paise, legacy field
      reason: 'NO_SHOW',
      createdAt: '2026-04-01T10:00:00.000Z',
    };
    mockLedgerItems.query.mockReturnValue(mockQuery([legacyNoShow]));

    const result = await customerCreditLedgerRepo.getBalance('cust-1');

    // Verify query call: the second argument (options) should NOT have partitionKey
    const queryCallArgs = mockLedgerItems.query.mock.calls[0] ?? [];
    // queryCallArgs[0] is the query spec, queryCallArgs[1] would be options (if passed)
    // The query should use @cid parameter (cross-partition)
    expect(queryCallArgs[0]).toMatchObject({
      query: expect.stringContaining('@cid'),
      parameters: expect.arrayContaining([{ name: '@cid', value: 'cust-1' }]),
    });
    // Options arg should either be absent or not contain partitionKey
    const options = queryCallArgs[1] as Record<string, unknown> | undefined;
    if (options) {
      expect(options).not.toHaveProperty('partitionKey');
    }

    // Balance should include the legacy no-show credit
    expect(result.balanceInPaise).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// P1-2: Legacy doc shape normalization
// ---------------------------------------------------------------------------

describe('P1-2: legacy no-show credit doc normalization', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('treats legacy { amount, reason: NO_SHOW } doc as CREDIT_ISSUED with amountInPaise = amount', async () => {
    const legacyDoc = {
      id: 'bk-legacy',
      customerId: 'cust-2',
      bookingId: 'bk-legacy',
      amount: 50000, // paise
      reason: 'NO_SHOW',
      createdAt: '2026-03-15T06:00:00.000Z',
    };
    mockLedgerItems.query.mockReturnValue(mockQuery([legacyDoc]));

    const result = await customerCreditLedgerRepo.getBalance('cust-2');
    expect(result.balanceInPaise).toBe(50000);
  });

  it('skips sentinel doc (id starts with sentinel:) from balance computation', async () => {
    const sentinelDoc = {
      id: 'sentinel:cust-3',
      customerId: 'cust-3',
      balanceInPaise: 99999, // this should NOT be used in balance
      lastUpdatedAt: new Date().toISOString(),
    };
    const creditDoc = {
      id: 'entry-1',
      customerId: 'cust-3',
      type: 'CREDIT_ISSUED',
      amountInPaise: 50000,
      reason: 'No-show credit',
      createdAt: '2026-04-01T10:00:00.000Z',
    };
    mockLedgerItems.query.mockReturnValue(mockQuery([creditDoc, sentinelDoc]));

    const result = await customerCreditLedgerRepo.getBalance('cust-3');
    expect(result.balanceInPaise).toBe(50000); // sentinel ignored
  });

  it('returns 0 balance for docs with unknown/missing type and no legacy amount', async () => {
    const unknownDoc = {
      id: 'mystery-doc',
      customerId: 'cust-4',
      // no type, no amount, no amountInPaise
      reason: 'SOMETHING_ELSE',
      createdAt: new Date().toISOString(),
    };
    mockLedgerItems.query.mockReturnValue(mockQuery([unknownDoc]));

    const result = await customerCreditLedgerRepo.getBalance('cust-4');
    expect(result.balanceInPaise).toBe(0);
  });

  it('getLedgerPage returns normalized entries excluding sentinels', async () => {
    const legacy = {
      id: 'bk-p1',
      customerId: 'cust-5',
      amount: 50000,
      reason: 'NO_SHOW',
      createdAt: '2026-04-01T10:00:00.000Z',
    };
    const sentinel = { id: 'sentinel:cust-5', customerId: 'cust-5', balanceInPaise: 50000 };
    // Count query returns 2, page query returns both
    mockLedgerItems.query
      .mockReturnValueOnce(mockQuery([2])) // count query
      .mockReturnValueOnce(mockQuery([legacy, sentinel])); // page query

    const result = await customerCreditLedgerRepo.getLedgerPage('cust-5', 1, 20);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.type).toBe('CREDIT_ISSUED');
    expect(result.entries[0]!.amountInPaise).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// P1-3: Idempotency replay tied to bookingId
// ---------------------------------------------------------------------------

describe('P1-3: idempotency key is tied to bookingId', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns cached result on replay with the SAME bookingId (idempotent)', async () => {
    // Existing idempotency record for the same booking
    const existingIdem = {
      id: 'idem-key-1',
      customerId: 'cust-6',
      bookingId: 'bk-same',
      appliedAmountInPaise: 50000,
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: existingIdem }),
    });

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-6',
      'bk-same', // same bookingId as stored
      50000,
      'idem-key-1',
    );

    expect(result.idempotent).toBe(true);
    expect(result.appliedAmountInPaise).toBe(50000);
    // No ledger write should happen
    expect(mockLedgerItems.create).not.toHaveBeenCalled();
  });

  it('throws 409 on replay with a DIFFERENT bookingId (replay abuse)', async () => {
    // Existing idempotency record for a DIFFERENT booking
    const existingIdem = {
      id: 'idem-key-2',
      customerId: 'cust-7',
      bookingId: 'bk-original',  // original booking
      appliedAmountInPaise: 50000,
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: existingIdem }),
    });

    // Replay with a different bookingId — should be rejected
    await expect(
      customerCreditLedgerRepo.applyCredit(
        'cust-7',
        'bk-different', // DIFFERENT bookingId
        50000,
        'idem-key-2',
      ),
    ).rejects.toMatchObject({ code: 409 });
  });
});

// ---------------------------------------------------------------------------
// P1-4: ETag-based optimistic concurrency
// ---------------------------------------------------------------------------

describe('P1-4: sentinel-based ETag concurrency', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates sentinel with IfNoneMatch when no sentinel exists, then writes ledger entry', async () => {
    // No existing idempotency record
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
    });

    // No sentinel doc exists yet
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return { read: vi.fn().mockResolvedValue({ resource: undefined, etag: undefined }) };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    // computeBalance query → one legacy no-show credit
    mockLedgerItems.query.mockReturnValue(
      mockQuery([{
        id: 'bk-x',
        customerId: 'cust-8',
        amount: 80000,
        reason: 'NO_SHOW',
        createdAt: new Date().toISOString(),
      }]),
    );

    // Sentinel create succeeds; ledger entry create succeeds; idempotency create succeeds
    mockLedgerItems.create.mockResolvedValue({});
    mockIdempotencyItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-8',
      'bk-new',
      50000,
      'idem-key-new',
    );

    expect(result.appliedAmountInPaise).toBe(50000);
    expect(result.idempotent).toBe(false);
    // Should have created sentinel + ledger entry
    expect(mockLedgerItems.create).toHaveBeenCalledTimes(2);
  });

  it('retries after 412 conflict on sentinel write and succeeds on second attempt', async () => {
    // No existing idempotency record
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
    });

    // Sentinel exists with etag
    const sentinelReadMock = vi.fn()
      .mockResolvedValueOnce({ resource: { id: 'sentinel:cust-9', customerId: 'cust-9', balanceInPaise: 70000, lastUpdatedAt: '' }, etag: 'etag-v1' })
      .mockResolvedValueOnce({ resource: { id: 'sentinel:cust-9', customerId: 'cust-9', balanceInPaise: 70000, lastUpdatedAt: '' }, etag: 'etag-v2' });

    const sentinelReplaceMock = vi.fn()
      .mockRejectedValueOnce({ code: 412 }) // first attempt fails
      .mockResolvedValueOnce({});            // second attempt succeeds

    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return { read: sentinelReadMock, replace: sentinelReplaceMock };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    mockLedgerItems.create.mockResolvedValue({});
    mockIdempotencyItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-9',
      'bk-retry',
      50000,
      'idem-key-retry',
    );

    expect(result.appliedAmountInPaise).toBe(50000);
    expect(sentinelReplaceMock).toHaveBeenCalledTimes(2); // 1 failure + 1 success
    // Ledger entry + idempotency record written after successful sentinel
    expect(mockLedgerItems.create).toHaveBeenCalledTimes(1);
    expect(mockIdempotencyItems.create).toHaveBeenCalledTimes(1);
  });

  it('returns 0 applied amount when balance is 0 (no ledger write)', async () => {
    // No existing idempotency record
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
    });

    // Sentinel exists with 0 balance
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: { id: 'sentinel:cust-10', customerId: 'cust-10', balanceInPaise: 0, lastUpdatedAt: '' },
            etag: 'etag-zero',
          }),
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-10',
      'bk-zero',
      50000,
      'idem-key-zero',
    );

    expect(result.appliedAmountInPaise).toBe(0);
    expect(mockLedgerItems.create).not.toHaveBeenCalled();
  });
});

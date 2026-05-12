/**
 * E13-S01 — Unit tests for customer-credit-ledger-repository
 *
 * Covers Codex P1 financial-correctness fixes:
 *   P1-1: Cross-partition query (container partitioned by /id, not /customerId)
 *   P1-2: Legacy no-show credit doc shape normalization (amount → amountInPaise)
 *   P1-3: Idempotency record written FIRST (idempotency-first) — prevent same-key races
 *   P1-4: ETag-based optimistic concurrency on sentinel doc (prevent double-debit)
 *          + sentinel reconciliation with later CREDIT_ISSUED docs
 *   P2-5: Filter sentinel docs in SQL before count and paginate (WHERE NOT STARTSWITH)
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
// P2-5: getLedgerPage filters sentinels via NOT STARTSWITH in SQL
// ---------------------------------------------------------------------------

describe('P2-5: getLedgerPage uses NOT STARTSWITH(c.id, "sentinel:") in SQL', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('count query includes NOT STARTSWITH filter so sentinel is excluded before counting', async () => {
    mockLedgerItems.query
      .mockReturnValueOnce(mockQuery([1])) // count = 1 (already excludes sentinel from SQL)
      .mockReturnValueOnce(mockQuery([])); // page = empty

    await customerCreditLedgerRepo.getLedgerPage('cust-p25', 1, 20);

    // Verify the count query SQL contains the sentinel filter
    const countQueryArgs = mockLedgerItems.query.mock.calls[0]?.[0] as { query: string } | undefined;
    expect(countQueryArgs?.query).toMatch(/NOT STARTSWITH\(c\.id,\s*'sentinel:'\)/i);
  });

  it('page query includes NOT STARTSWITH filter so sentinel cannot land in a page window', async () => {
    mockLedgerItems.query
      .mockReturnValueOnce(mockQuery([2])) // count
      .mockReturnValueOnce(mockQuery([])); // page

    await customerCreditLedgerRepo.getLedgerPage('cust-p25b', 1, 20);

    // Verify the page query SQL also contains the sentinel filter
    const pageQueryArgs = mockLedgerItems.query.mock.calls[1]?.[0] as { query: string } | undefined;
    expect(pageQueryArgs?.query).toMatch(/NOT STARTSWITH\(c\.id,\s*'sentinel:'\)/i);
  });

  it('customer with only CREDIT_ISSUED docs (no sentinel) gets correct total without -1 correction', async () => {
    // With the old code (rawCount - 1), a customer who has never debited would get total = 0
    // even with 1 credit. The new SQL filter returns the true count.
    mockLedgerItems.query
      .mockReturnValueOnce(mockQuery([3])) // count = 3 real ledger entries, no sentinel
      .mockReturnValueOnce(mockQuery([
        { id: 'c1', customerId: 'cust-new', type: 'CREDIT_ISSUED', amountInPaise: 50000, reason: 'no-show', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'c2', customerId: 'cust-new', type: 'CREDIT_ISSUED', amountInPaise: 50000, reason: 'no-show', createdAt: '2026-01-02T00:00:00.000Z' },
        { id: 'c3', customerId: 'cust-new', type: 'CREDIT_ISSUED', amountInPaise: 50000, reason: 'no-show', createdAt: '2026-01-03T00:00:00.000Z' },
      ]));

    const result = await customerCreditLedgerRepo.getLedgerPage('cust-new', 1, 20);
    // Total must be 3 (not 2 as the old -1 correction would give)
    expect(result.total).toBe(3);
    expect(result.entries).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// P1-3: Idempotency-first — write record BEFORE sentinel debit
// ---------------------------------------------------------------------------

describe('P1-3: idempotency-first prevents same-key concurrent double-debit', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('writes idempotency doc FIRST (IfNoneMatch: *) before touching the sentinel', async () => {
    // applyCredit should attempt to create the idempotency doc BEFORE any sentinel read/write.
    // We verify this by checking create is called on the idempotency container BEFORE the
    // sentinel container (sentinel is in the ledger container, idem is in idempotency container).
    const createOrder: string[] = [];

    mockIdempotencyItems.create.mockImplementation(() => {
      createOrder.push('idem');
      return Promise.resolve({});
    });
    mockLedgerItems.create.mockImplementation(() => {
      createOrder.push('ledger');
      return Promise.resolve({});
    });

    // No existing sentinel
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return { read: vi.fn().mockResolvedValue({ resource: undefined, etag: undefined }), replace: vi.fn() };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });
    // computeBalance query
    mockLedgerItems.query.mockReturnValue(
      mockQuery([{ id: 'bk-x', customerId: 'cust-idem-first', amount: 80000, reason: 'NO_SHOW', createdAt: '2026-01-01T00:00:00.000Z' }]),
    );

    await customerCreditLedgerRepo.applyCredit('cust-idem-first', 'bk-idem-f', 50000, 'key-idem-f');

    // idempotency write must precede any ledger write
    expect(createOrder[0]).toBe('idem');
    expect(createOrder).toContain('ledger');
  });

  it('returns cached result on APPLIED replay with the SAME bookingId (idempotent)', async () => {
    // applyCredit tries IfNoneMatch create → 409 → read existing → status APPLIED, same bookingId → return cached
    const existingIdem = {
      id: 'idem-key-1',
      customerId: 'cust-6',
      bookingId: 'bk-same',
      appliedAmountInPaise: 50000,
      status: 'APPLIED',
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };
    mockIdempotencyItems.create.mockRejectedValue({ code: 409 }); // simulate concurrent write
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: existingIdem }),
      replace: vi.fn().mockResolvedValue({}),
    });

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-6',
      'bk-same',
      50000,
      'idem-key-1',
    );

    expect(result.idempotent).toBe(true);
    expect(result.appliedAmountInPaise).toBe(50000);
    // No ledger write should happen (idempotent early return)
    expect(mockLedgerItems.create).not.toHaveBeenCalled();
  });

  it('proceeds with debit when existing idempotency doc has status RESERVED (P1-2 reservation)', async () => {
    // Reservation was pre-written by reserveCredit before the Razorpay order.
    // applyCredit in the webhook should see RESERVED and proceed with the actual debit.
    const reservedIdem = {
      id: 'idem-reserved',
      customerId: 'cust-res',
      bookingId: 'bk-res',
      appliedAmountInPaise: 0,
      reservedAmountInPaise: 50000,
      status: 'RESERVED',
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };
    mockIdempotencyItems.create.mockRejectedValue({ code: 409 }); // reservation already exists
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: reservedIdem }),
      replace: vi.fn().mockResolvedValue({}),
    });

    // Sentinel with balance
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: { id: 'sentinel:cust-res', customerId: 'cust-res', balanceInPaise: 70000, lastUpdatedAt: '', lastReconciledAt: '2026-01-01T00:00:00.000Z' },
            etag: 'etag-res',
          }),
          replace: vi.fn().mockResolvedValue({}),
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });
    // No new credits after lastReconciledAt
    mockLedgerItems.query.mockReturnValue(mockQuery([]));
    mockLedgerItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit('cust-res', 'bk-res', 50000, 'idem-reserved');

    // Should have proceeded with actual debit (not returned 0 idempotent)
    expect(result.appliedAmountInPaise).toBe(50000);
    expect(result.idempotent).toBe(false);
    // Ledger entry (CREDIT_APPLIED) should have been written
    expect(mockLedgerItems.create).toHaveBeenCalled();
  });

  it('throws 409 on replay with a DIFFERENT bookingId (replay abuse)', async () => {
    const existingIdem = {
      id: 'idem-key-2',
      customerId: 'cust-7',
      bookingId: 'bk-original',
      appliedAmountInPaise: 50000,
      status: 'APPLIED',
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };
    mockIdempotencyItems.create.mockRejectedValue({ code: 409 });
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: existingIdem }),
      replace: vi.fn().mockResolvedValue({}),
    });

    await expect(
      customerCreditLedgerRepo.applyCredit('cust-7', 'bk-different', 50000, 'idem-key-2'),
    ).rejects.toMatchObject({ code: 409 });
  });

  it('two concurrent same-key calls: only one debits (idempotency-first race protection)', async () => {
    // Simulate: call A writes idem doc successfully; call B sees 409 on idem write,
    // reads existing record with same bookingId and status APPLIED → returns cached.
    let idemCreateCalled = 0;
    mockIdempotencyItems.create.mockImplementation(() => {
      idemCreateCalled++;
      if (idemCreateCalled === 1) {
        // Call A succeeds
        return Promise.resolve({});
      }
      // Call B fails with 409 (A already wrote it)
      return Promise.reject(Object.assign(new Error('Conflict'), { code: 409 }));
    });

    const appliedIdem = {
      id: 'race-key',
      customerId: 'cust-race',
      bookingId: 'bk-race',
      appliedAmountInPaise: 50000,
      status: 'APPLIED',
      createdAt: new Date().toISOString(),
      ttl: 86400,
    };

    const readMock = vi.fn().mockResolvedValue({ resource: appliedIdem });
    const replaceMock = vi.fn().mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({ read: readMock, replace: replaceMock });

    // Sentinel for call A
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: { id: 'sentinel:cust-race', customerId: 'cust-race', balanceInPaise: 80000, lastUpdatedAt: '', lastReconciledAt: '2026-01-01T00:00:00.000Z' },
            etag: 'etag-race',
          }),
          replace: vi.fn().mockResolvedValue({}),
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });
    mockLedgerItems.query.mockReturnValue(mockQuery([]));
    mockLedgerItems.create.mockResolvedValue({});

    // Call A succeeds: debits wallet
    const resultA = await customerCreditLedgerRepo.applyCredit('cust-race', 'bk-race', 50000, 'race-key');
    expect(resultA.appliedAmountInPaise).toBe(50000);
    expect(resultA.idempotent).toBe(false);

    // Call B: returns cached (idempotent); does NOT debit again
    const resultB = await customerCreditLedgerRepo.applyCredit('cust-race', 'bk-race', 50000, 'race-key');
    expect(resultB.idempotent).toBe(true);
    expect(resultB.appliedAmountInPaise).toBe(50000);
  });
});

// ---------------------------------------------------------------------------
// P1-4: ETag-based optimistic concurrency + sentinel reconciliation
// ---------------------------------------------------------------------------

describe('P1-4: sentinel-based ETag concurrency + reconciliation with later CREDIT_ISSUED', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates sentinel with IfNoneMatch when no sentinel exists, then writes ledger entry', async () => {
    // idempotency-first: create succeeds (no prior record)
    mockIdempotencyItems.create.mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      replace: vi.fn().mockResolvedValue({}),
    });

    // No sentinel doc exists yet
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return { read: vi.fn().mockResolvedValue({ resource: undefined, etag: undefined }), replace: vi.fn() };
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

    // Sentinel create succeeds; ledger entry create succeeds
    mockLedgerItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-8',
      'bk-new',
      50000,
      'idem-key-new',
    );

    expect(result.appliedAmountInPaise).toBe(50000);
    expect(result.idempotent).toBe(false);
    // Should have created sentinel + ledger entry (2 writes to ledger container)
    expect(mockLedgerItems.create).toHaveBeenCalledTimes(2);
  });

  it('retries after 412 conflict on sentinel write and succeeds on second attempt', async () => {
    // idempotency-first: create succeeds
    mockIdempotencyItems.create.mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      replace: vi.fn().mockResolvedValue({}),
    });

    // Sentinel exists with etag. On retry (second read), the balance is the same.
    const sentinelReadMock = vi.fn()
      .mockResolvedValueOnce({ resource: { id: 'sentinel:cust-9', customerId: 'cust-9', balanceInPaise: 70000, lastUpdatedAt: '', lastReconciledAt: '2026-01-01T00:00:00.000Z' }, etag: 'etag-v1' })
      .mockResolvedValueOnce({ resource: { id: 'sentinel:cust-9', customerId: 'cust-9', balanceInPaise: 70000, lastUpdatedAt: '', lastReconciledAt: '2026-01-01T00:00:00.000Z' }, etag: 'etag-v2' });

    const sentinelReplaceMock = vi.fn()
      .mockRejectedValueOnce({ code: 412 }) // first attempt fails
      .mockResolvedValueOnce({});            // second attempt succeeds

    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return { read: sentinelReadMock, replace: sentinelReplaceMock };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    // Reconciliation queries: no new credits after lastReconciledAt (both attempts)
    mockLedgerItems.query.mockReturnValue(mockQuery([]));
    mockLedgerItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-9',
      'bk-retry',
      50000,
      'idem-key-retry',
    );

    expect(result.appliedAmountInPaise).toBe(50000);
    expect(sentinelReplaceMock).toHaveBeenCalledTimes(2); // 1 failure + 1 success
    // Ledger entry written after successful sentinel
    expect(mockLedgerItems.create).toHaveBeenCalledTimes(1);
    expect(mockIdempotencyItems.create).toHaveBeenCalledTimes(1);
  });

  it('returns 0 applied amount when balance is 0 (no ledger write)', async () => {
    mockIdempotencyItems.create.mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      replace: vi.fn().mockResolvedValue({}),
    });

    // Sentinel exists with 0 balance; no new credits after lastReconciledAt
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: { id: 'sentinel:cust-10', customerId: 'cust-10', balanceInPaise: 0, lastUpdatedAt: '', lastReconciledAt: '2026-01-01T00:00:00.000Z' },
            etag: 'etag-zero',
          }),
          replace: vi.fn(),
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });
    mockLedgerItems.query.mockReturnValue(mockQuery([]));

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-10',
      'bk-zero',
      50000,
      'idem-key-zero',
    );

    expect(result.appliedAmountInPaise).toBe(0);
    expect(mockLedgerItems.create).not.toHaveBeenCalled();
  });

  it('P1-4 reconciliation: credits issued after sentinel.lastReconciledAt are folded in before debit', async () => {
    // Scenario: sentinel has balanceInPaise=0 but a CREDIT_ISSUED doc was created AFTER
    // lastReconciledAt by the no-show detector. Without reconciliation, applyCredit would
    // see balance=0 and return 0 (credit cannot be spent). With reconciliation, it adds
    // the new credit and correctly debits 50000.
    mockIdempotencyItems.create.mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      replace: vi.fn().mockResolvedValue({}),
    });

    const lastReconciledAt = '2026-04-01T10:00:00.000Z';
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: {
              id: 'sentinel:cust-recon',
              customerId: 'cust-recon',
              balanceInPaise: 0, // spent; sentinel thinks balance is 0
              lastUpdatedAt: lastReconciledAt,
              lastReconciledAt,
            },
            etag: 'etag-recon',
          }),
          replace: vi.fn().mockResolvedValue({}),
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    // Reconciliation query returns a new CREDIT_ISSUED doc (from no-show detector, after lastReconciledAt)
    mockLedgerItems.query.mockReturnValue(
      mockQuery([{
        id: 'bk-noshow-after',
        customerId: 'cust-recon',
        type: 'CREDIT_ISSUED',
        amountInPaise: 50000,
        reason: 'No-show credit',
        createdAt: '2026-04-02T08:00:00.000Z', // after lastReconciledAt
      }]),
    );
    mockLedgerItems.create.mockResolvedValue({});

    const result = await customerCreditLedgerRepo.applyCredit(
      'cust-recon',
      'bk-after-noshow',
      50000,
      'idem-recon',
    );

    // Without reconciliation this would return 0; with reconciliation it returns 50000
    expect(result.appliedAmountInPaise).toBe(50000);
    expect(result.newBalanceInPaise).toBe(0);
  });

  it('P1-4 reconciliation: sentinel written with updated lastReconciledAt after successful debit', async () => {
    mockIdempotencyItems.create.mockResolvedValue({});
    mockIdempotencyItem.mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      replace: vi.fn().mockResolvedValue({}),
    });

    const oldReconciledAt = '2026-03-01T00:00:00.000Z';
    const sentinelReplaceMock = vi.fn().mockResolvedValue({});
    mockLedgerItem.mockImplementation((id: string) => {
      if (id.startsWith('sentinel:')) {
        return {
          read: vi.fn().mockResolvedValue({
            resource: {
              id: 'sentinel:cust-ts',
              customerId: 'cust-ts',
              balanceInPaise: 30000,
              lastUpdatedAt: oldReconciledAt,
              lastReconciledAt: oldReconciledAt,
            },
            etag: 'etag-ts',
          }),
          replace: sentinelReplaceMock,
        };
      }
      return { read: vi.fn().mockResolvedValue({ resource: undefined }) };
    });

    // No new credits after lastReconciledAt
    mockLedgerItems.query.mockReturnValue(mockQuery([]));
    mockLedgerItems.create.mockResolvedValue({});

    await customerCreditLedgerRepo.applyCredit('cust-ts', 'bk-ts', 20000, 'idem-ts');

    // Verify sentinel was replaced with a lastReconciledAt newer than oldReconciledAt
    const replacedDoc = sentinelReplaceMock.mock.calls[0]?.[0] as { lastReconciledAt?: string } | undefined;
    const reconciledAt = replacedDoc?.lastReconciledAt;
    expect(reconciledAt).toBeDefined();
    expect(typeof reconciledAt === 'string' && reconciledAt > oldReconciledAt).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { recordCommissionDue, resolveCommissionForBooking, settleCashCompletion, finalizeLedgerForTechnician } = vi.hoisted(() => ({
  recordCommissionDue: vi.fn(),
  resolveCommissionForBooking: vi.fn(),
  settleCashCompletion: vi.fn(),
  finalizeLedgerForTechnician: vi.fn(),
}));
const { systemAudit } = vi.hoisted(() => ({ systemAudit: vi.fn() }));
const { getByBookingId } = vi.hoisted(() => ({ getByBookingId: vi.fn() }));
const { mockFetchNext, mockHasMoreResults, querySpy } = vi.hoisted(() => ({
  mockFetchNext: vi.fn(),
  mockHasMoreResults: vi.fn(),
  querySpy: vi.fn(),
}));

vi.mock('../../src/services/commission-settlement.service.js', () => ({
  recordCommissionDue,
  resolveCommissionForBooking,
  settleCashCompletion,
  finalizeLedgerForTechnician,
}));
vi.mock('../../src/services/auditLog.service.js', () => ({ systemAudit }));
vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
  commissionReceivableRepo: { getByBookingId },
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: () => ({
    items: {
      query: (...args: unknown[]) => {
        querySpy(...args);
        return { fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults };
      },
    },
  }),
}));

import { main } from '../../scripts/backfill-historical-receivables.js';

const booking = (over: Record<string, unknown> = {}) => ({
  id: 'bk-1',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  slotDate: '2026-08-24',
  slotWindow: '10:00-12:00',
  addressText: '12 Main Road, Ayodhya',
  addressLatLng: { lat: 26.79, lng: 82.19 },
  status: 'COMPLETED',
  paymentOrderId: 'order-1',
  paymentMethod: 'CASH_ON_SERVICE',
  paymentId: null,
  paymentSignature: null,
  amount: 59900,
  technicianId: 'tech-1',
  createdAt: '2026-08-24T10:00:00.000Z',
  ...over,
});

/** One page of results, then done. */
function onePage(rows: unknown[] | undefined) {
  mockHasMoreResults.mockReturnValueOnce(true).mockReturnValue(false);
  mockFetchNext.mockResolvedValueOnce({ resources: rows });
}

/** process.exit's signature returns never, which does not fit vi.spyOn's default generic. */
const CUTOFF = '--completed-before=2026-09-01T00:00:00.000Z';

const makeExitSpy = () => vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

describe('backfill-historical-receivables CLI', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof makeExitSpy>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasMoreResults.mockReset();
    mockFetchNext.mockReset();
    getByBookingId.mockResolvedValue(undefined);
    resolveCommissionForBooking.mockResolvedValue({
      bookingAmount: 59900,
      bps: 2200,
      commissionDue: 13178,
      commissionResolvedFrom: 'GLOBAL',
    });
    recordCommissionDue.mockResolvedValue({
      created: true,
      commissionDue: 13178,
      commissionBps: 2200,
      commissionResolvedFrom: 'GLOBAL',
    });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = makeExitSpy();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('defaults to dry-run and writes nothing', async () => {
    onePage([booking()]);

    await main([CUTOFF]);

    expect(recordCommissionDue).not.toHaveBeenCalled();
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('dry-run previews the commission via the shared resolver, not its own arithmetic', async () => {
    onePage([booking()]);

    await main([CUTOFF, '--dry-run']);

    expect(resolveCommissionForBooking).toHaveBeenCalledTimes(1);
    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  it('--apply records a receivable for each eligible booking', async () => {
    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);

    await main([CUTOFF, '--apply']);

    expect(recordCommissionDue).toHaveBeenCalledTimes(2);
  });

  it('--apply audits COMMISSION_DUE_RECORDED with a backfill marker, only for rows it created', async () => {
    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);
    recordCommissionDue
      .mockResolvedValueOnce({ created: true, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' })
      .mockResolvedValueOnce({ created: false, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });

    await main([CUTOFF, '--apply']);

    expect(systemAudit).toHaveBeenCalledTimes(1);
    const [action, resourceType, resourceId, payload] = systemAudit.mock.calls[0] as [string, string, string, Record<string, unknown>];
    expect(action).toBe('COMMISSION_DUE_RECORDED');
    expect(resourceType).toBe('booking');
    expect(resourceId).toBe('bk-1');
    expect(payload).toMatchObject({ backfill: true });
  });

  it('never routes through settleCashCompletion, whose side effects would be wrong for old jobs', async () => {
    onePage([booking()]);

    await main([CUTOFF, '--apply']);

    // settleCashCompletion also increments completedJobCount and pushes an EARNINGS_UPDATE.
    // Replaying those for a months-old job would double-count totals and notify the technician
    // about ancient work, so the backfill must call recordCommissionDue directly.
    expect(recordCommissionDue).toHaveBeenCalledTimes(1);
    expect(settleCashCompletion).not.toHaveBeenCalled();
  });

  it('skips a booking that already has a receivable', async () => {
    onePage([booking()]);
    getByBookingId.mockResolvedValue({ id: 'bk-1', commissionDue: 13178 });

    await main([CUTOFF, '--apply']);

    expect(recordCommissionDue).not.toHaveBeenCalled();
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('tolerates the undefined page.resources Cosmos returns', async () => {
    onePage(undefined);

    await main([CUTOFF, '--apply']);

    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  // Codex review, 2026-09-07 (both P2, money-ledger correctness).
  it('stamps the receivable with when the job completed, not when the backfill ran', async () => {
    onePage([booking({ completedAt: '2026-05-08T09:30:00.000Z' })]);

    await main([CUTOFF, '--apply']);

    expect(recordCommissionDue).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bk-1' }),
      { createdAt: '2026-05-08T09:30:00.000Z' },
    );
  });

  it('falls back to the booking createdAt when completedAt is absent', async () => {
    onePage([booking({ createdAt: '2026-05-01T00:00:00.000Z' })]);

    await main([CUTOFF, '--apply']);

    expect(recordCommissionDue).toHaveBeenCalledWith(expect.anything(), { createdAt: '2026-05-01T00:00:00.000Z' });
  });

  it('consumes open credits and recomputes the hold once per affected technician', async () => {
    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' }), booking({ id: 'bk-3', technicianId: 'tech-2' })]);

    await main([CUTOFF, '--apply']);

    expect(finalizeLedgerForTechnician).toHaveBeenCalledTimes(2);
    expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-1');
    expect(finalizeLedgerForTechnician).toHaveBeenCalledWith('tech-2');
  });

  it('does not finalize a ledger when nothing was created', async () => {
    onePage([booking()]);
    getByBookingId.mockResolvedValue({ id: 'bk-1', commissionDue: 13178 });

    await main([CUTOFF, '--apply']);

    expect(finalizeLedgerForTechnician).not.toHaveBeenCalled();
  });

  // Codex review round 2, 2026-09-07 (P2): active-job.ts writes COMPLETED before calling
  // settleCashCompletion, so a backfill without a cutoff can claim a job that is settling right
  // now and rob it of its completedJobCount increment and earnings push.
  it('requires an explicit --completed-before cutoff', async () => {
    await main(['--apply']);

    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  it('rejects an unparseable cutoff', async () => {
    await main(['--completed-before=not-a-date', '--apply']);

    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  it('passes the cutoff to Cosmos as a bound parameter', async () => {
    onePage([booking()]);

    await main([CUTOFF, '--dry-run']);

    expect(querySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: [{ name: '@cutoff', value: '2026-09-01T00:00:00.000Z' }],
      }),
      expect.anything(),
    );
  });

  // Codex review round 3, 2026-09-07 (P2): Cosmos compares these lexicographically, so a
  // non-ISO cutoff would sort after real timestamps and widen the window instead of narrowing it.
  it('normalises a non-ISO cutoff to canonical ISO before binding it', async () => {
    onePage([booking()]);

    await main(['--completed-before=9/1/2026', '--dry-run']);

    const [spec] = querySpy.mock.calls.at(-1) as [{ parameters: Array<{ name: string; value: string }> }];
    expect(spec.parameters[0]!.value).toBe(new Date('9/1/2026').toISOString());
    expect(spec.parameters[0]!.value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects unknown flags and both-mode invocations', async () => {
    await main([CUTOFF, '--nope']);
    expect(exitSpy).toHaveBeenCalledWith(2);

    exitSpy.mockClear();
    await main([CUTOFF, '--dry-run', '--apply']);
    expect(exitSpy).toHaveBeenCalledWith(2);
  });
});

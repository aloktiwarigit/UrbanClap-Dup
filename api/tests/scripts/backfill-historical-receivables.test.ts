import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { recordCommissionDue, resolveCommissionForBooking } = vi.hoisted(() => ({
  recordCommissionDue: vi.fn(),
  resolveCommissionForBooking: vi.fn(),
}));
const { systemAudit } = vi.hoisted(() => ({ systemAudit: vi.fn() }));
const { getByBookingId } = vi.hoisted(() => ({ getByBookingId: vi.fn() }));
const { mockFetchNext, mockHasMoreResults } = vi.hoisted(() => ({
  mockFetchNext: vi.fn(),
  mockHasMoreResults: vi.fn(),
}));

vi.mock('../../src/services/commission-settlement.service.js', () => ({
  recordCommissionDue,
  resolveCommissionForBooking,
}));
vi.mock('../../src/services/auditLog.service.js', () => ({ systemAudit }));
vi.mock('../../src/cosmos/commission-receivable-repository.js', () => ({
  commissionReceivableRepo: { getByBookingId },
}));
vi.mock('../../src/cosmos/client.js', () => ({
  getBookingsContainer: () => ({
    items: { query: () => ({ fetchNext: mockFetchNext, hasMoreResults: mockHasMoreResults }) },
  }),
}));

import { main } from '../../scripts/backfill-historical-receivables.js';

const booking = (over: Record<string, unknown> = {}) => ({
  id: 'bk-1',
  status: 'COMPLETED',
  paymentMethod: 'CASH_ON_SERVICE',
  technicianId: 'tech-1',
  serviceId: 'svc-1',
  categoryId: 'cat-1',
  amount: 59900,
  slotDate: '2026-08-24',
  ...over,
});

/** One page of results, then done. */
function onePage(rows: unknown[] | undefined) {
  mockHasMoreResults.mockReturnValueOnce(true).mockReturnValue(false);
  mockFetchNext.mockResolvedValueOnce({ resources: rows });
}

describe('backfill-historical-receivables CLI', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

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
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('defaults to dry-run and writes nothing', async () => {
    onePage([booking()]);

    await main([]);

    expect(recordCommissionDue).not.toHaveBeenCalled();
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('dry-run previews the commission via the shared resolver, not its own arithmetic', async () => {
    onePage([booking()]);

    await main(['--dry-run']);

    expect(resolveCommissionForBooking).toHaveBeenCalledTimes(1);
    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  it('--apply records a receivable for each eligible booking', async () => {
    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);

    await main(['--apply']);

    expect(recordCommissionDue).toHaveBeenCalledTimes(2);
  });

  it('--apply audits COMMISSION_DUE_RECORDED with a backfill marker, only for rows it created', async () => {
    onePage([booking({ id: 'bk-1' }), booking({ id: 'bk-2' })]);
    recordCommissionDue
      .mockResolvedValueOnce({ created: true, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' })
      .mockResolvedValueOnce({ created: false, commissionDue: 13178, commissionBps: 2200, commissionResolvedFrom: 'GLOBAL' });

    await main(['--apply']);

    expect(systemAudit).toHaveBeenCalledTimes(1);
    const [action, resourceType, resourceId, payload] = systemAudit.mock.calls[0] as [string, string, string, Record<string, unknown>];
    expect(action).toBe('COMMISSION_DUE_RECORDED');
    expect(resourceType).toBe('booking');
    expect(resourceId).toBe('bk-1');
    expect(payload).toMatchObject({ backfill: true });
  });

  it('never fires FCM earnings pushes or job-count increments for historical jobs', async () => {
    onePage([booking()]);

    await main(['--apply']);

    // settleCashCompletion is the side-effecting path; the backfill must not import or call it.
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('scripts/backfill-historical-receivables.ts', 'utf8'),
    );
    expect(src).not.toMatch(/settleCashCompletion|sendTechEarningsUpdate|incrementCompletedJobCount/);
  });

  it('skips a booking that already has a receivable', async () => {
    onePage([booking()]);
    getByBookingId.mockResolvedValue({ id: 'bk-1', commissionDue: 13178 });

    await main(['--apply']);

    expect(recordCommissionDue).not.toHaveBeenCalled();
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('tolerates the undefined page.resources Cosmos returns', async () => {
    onePage(undefined);

    await main(['--apply']);

    expect(recordCommissionDue).not.toHaveBeenCalled();
  });

  it('rejects unknown flags and both-mode invocations', async () => {
    await main(['--nope']);
    expect(exitSpy).toHaveBeenCalledWith(2);

    exitSpy.mockClear();
    await main(['--dry-run', '--apply']);
    expect(exitSpy).toHaveBeenCalledWith(2);
  });
});

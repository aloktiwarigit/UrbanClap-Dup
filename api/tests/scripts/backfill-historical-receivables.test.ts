import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { recordCommissionDue, resolveCommissionForBooking, settleCashCompletion } = vi.hoisted(() => ({
  recordCommissionDue: vi.fn(),
  resolveCommissionForBooking: vi.fn(),
  settleCashCompletion: vi.fn(),
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
  settleCashCompletion,
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

  it('never routes through settleCashCompletion, whose side effects would be wrong for old jobs', async () => {
    onePage([booking()]);

    await main(['--apply']);

    // settleCashCompletion also increments completedJobCount and pushes an EARNINGS_UPDATE.
    // Replaying those for a months-old job would double-count totals and notify the technician
    // about ancient work, so the backfill must call recordCommissionDue directly.
    expect(recordCommissionDue).toHaveBeenCalledTimes(1);
    expect(settleCashCompletion).not.toHaveBeenCalled();
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

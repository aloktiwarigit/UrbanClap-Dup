import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/cosmos/commission-receivable-repository.js');
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { applyCredit, consumePendingCredits } from '../../src/services/commission-allocator.service.js';

const row = (id: string, due: number, createdAt: string) => ({
  entry: { id, bookingId: id, technicianId: 't1', partitionKey: 't1', serviceId: 's', categoryId: 'c', bookingAmount: 1, commissionBps: 2000,
    commissionDue: due, commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const, createdAt },
  etag: `"${id}"`, outstandingPaise: due,
});
const base = { technicianId: 't1', refId: 'rem:k1', source: 'REMITTANCE' as const, byId: 'a1',
  anchor: { id: 'rem:k1', build: (plan: { allocations: unknown[]; leftoverPaise: number }) => ({ id: 'rem:k1', docType: 'REMITTANCE', allocations: plan.allocations, creditCreatedPaise: plan.leftoverPaise }) } };

/** `count` DUE rows, `amountEach` paise, strictly increasing createdAt (minute-resolution, safe past day/hour rollover). */
const manyRows = (count: number, amountEach: number, startIdx = 0) =>
  Array.from({ length: count }, (_, i) => {
    const idx = startIdx + i;
    return row(`b${String(idx).padStart(3, '0')}`, amountEach, new Date(Date.UTC(2026, 0, 1, 0, idx)).toISOString());
  });

beforeEach(() => vi.resetAllMocks());

describe('applyCredit', () => {
  it('builds [anchor create, replace per row, credit create] and returns allocations + leftover', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01'), row('b2', 300, '2026-09-02')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
    const r = await applyCredit({ ...base, paise: 600 });
    expect(r).toMatchObject({ replayed: false, allocations: [{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 300 }], creditCreatedPaise: 100 });
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    expect(ops.map((o) => o.operationType)).toEqual(['Create', 'Replace', 'Replace', 'Create']);
    expect((ops[0] as unknown as { resourceBody: { allocations: unknown[]; creditCreatedPaise: number } }).resourceBody).toMatchObject({ allocations: [{ bookingId: 'b1', paise: 200 }, { bookingId: 'b2', paise: 300 }], creditCreatedPaise: 100 });
    expect((ops[3] as unknown as { resourceBody: { id: string; remainingPaise: number } }).resourceBody).toMatchObject({ id: 'cr:rem:k1', remainingPaise: 100 });
    expect((ops[1] as { ifMatch?: string }).ifMatch).toBe('"b1"');
  });
  it('treats a 409 on the anchor as an idempotent replay when the existing anchor matches the request', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'CONFLICT' });
    vi.mocked(commissionReceivableRepo.readLedgerDoc).mockResolvedValue({ id: 'rem:k1', amountPaise: 100 });
    expect(await applyCredit({ ...base, paise: 100 })).toEqual({ replayed: true, anchorId: 'rem:k1' });
  });
  it('rejects with IDEMPOTENCY_MISMATCH when the existing anchor amountPaise differs from the request', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'CONFLICT' });
    vi.mocked(commissionReceivableRepo.readLedgerDoc).mockResolvedValue({ id: 'rem:k1', amountPaise: 500 });
    await expect(applyCredit({ ...base, paise: 100 })).rejects.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH', anchorId: 'rem:k1' });
  });
  it('re-plans a CONFLICT when the existing-anchor read comes back missing (conflict was not the anchor)', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce([row('b1', 200, '2026-09-01')])
      .mockResolvedValueOnce([{ ...row('b1', 200, '2026-09-01'), outstandingPaise: 50, etag: '"b1v2"' }]);
    vi.mocked(commissionReceivableRepo.readLedgerDoc).mockResolvedValue(null);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValueOnce({ ok: false, reason: 'CONFLICT' }).mockResolvedValueOnce({ ok: true });
    const r = await applyCredit({ ...base, paise: 100 });
    expect(r).toMatchObject({ replayed: false, allocations: [{ bookingId: 'b1', paise: 50 }], creditCreatedPaise: 50 });
    expect(commissionReceivableRepo.getOutstandingByTechnician).toHaveBeenCalledTimes(2);
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(2);
  });
  it('re-reads and re-plans on 412, then succeeds', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce([row('b1', 200, '2026-09-01')])
      .mockResolvedValueOnce([{ ...row('b1', 200, '2026-09-01'), outstandingPaise: 50, etag: '"b1v2"' }]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValueOnce({ ok: false, reason: 'PRECONDITION' }).mockResolvedValueOnce({ ok: true });
    const r = await applyCredit({ ...base, paise: 100 });
    expect(r).toMatchObject({ replayed: false, allocations: [{ bookingId: 'b1', paise: 50 }], creditCreatedPaise: 50 });
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(2);
  });
  it('gives up after 3 precondition failures', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'PRECONDITION' });
    await expect(applyCredit({ ...base, paise: 100 })).rejects.toThrow(/PRECONDITION/);
  });
});

describe('consumePendingCredits', () => {
  it('applies an open credit against a DUE row, updates remainingPaise absolutely, and stops once no DUE rows remain', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([{ doc: { id: 'cr:rem:k1', docType: 'CREDIT', technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT', refId: 'rem:k1', originalPaise: 100, remainingPaise: 100, consumedBy: [], createdAt: '2026-09-01' }, etag: '"c1"' }]);
    // 60 paise leaves this credit's remainingPaise at 40 > 0, so the fix tries another round on the
    // SAME credit before giving up — the second read comes back empty (row fully remitted elsewhere).
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce([row('b9', 60, '2026-09-05')])
      .mockResolvedValue([]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
    const r = await consumePendingCredits('t1');
    expect(r.consumedPaise).toBe(60);
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(1); // second round found no DUE rows, never issued a batch
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    expect(ops.map((o) => o.operationType)).toEqual(['Replace', 'Replace']); // credit doc + receivable
    expect((ops[0] as unknown as { resourceBody: { remainingPaise: number; consumedBy: unknown[] } }).resourceBody).toMatchObject({ remainingPaise: 40 });
  });
  it('is a no-op with no open credits or no DUE rows', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([]);
    expect(await consumePendingCredits('t1')).toEqual({ consumedPaise: 0 });
    expect(commissionReceivableRepo.runLedgerBatch).not.toHaveBeenCalled();
  });
  it('caps a batch at the row limit and continues the SAME credit in a second batch until exhausted', async () => {
    const rows100 = manyRows(100, 10, 0); // b000..b099, 10 paise each, sum 1000
    const credit = { id: 'cr:rem:big', docType: 'CREDIT' as const, technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT' as const, refId: 'rem:big', originalPaise: 1000, remainingPaise: 1000, consumedBy: [], createdAt: '2026-09-01' };
    const round1Consumed = rows100.slice(0, 99).map((r) => ({ bookingId: r.entry.bookingId, paise: 10, appliedAt: 't' }));
    vi.mocked(commissionReceivableRepo.getOpenCredits)
      .mockResolvedValueOnce([{ doc: credit, etag: '"c1"' }])
      .mockResolvedValueOnce([{ doc: { ...credit, remainingPaise: 10, consumedBy: round1Consumed }, etag: '"c1v2"' }]);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce(rows100)          // round 1: 100 rows available, cap takes 99
      .mockResolvedValueOnce([rows100[99]!]);  // round 2: the 1 leftover row
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });

    const r = await consumePendingCredits('t1');

    expect(r.consumedPaise).toBe(1000);
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(2);
    const ops1 = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    const ops2 = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[1]![1];
    expect(ops1.length).toBe(100); // 1 credit-doc replace + 99 row replaces — under the 100-op batch limit
    expect(ops2.length).toBe(2); // 1 credit-doc replace + the last row
    expect((ops2[0] as unknown as { resourceBody: { remainingPaise: number } }).resourceBody.remainingPaise).toBe(0);
  });
  it('exhausts the older credit before any batch is issued for a newer credit', async () => {
    const rows = manyRows(120, 10, 0); // b000..b119, 10 paise each
    const credit1 = { id: 'cr:rem:old', docType: 'CREDIT' as const, technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT' as const, refId: 'rem:old', originalPaise: 1000, remainingPaise: 1000, consumedBy: [], createdAt: '2026-08-01' };
    const credit2 = { id: 'cr:rem:new', docType: 'CREDIT' as const, technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT' as const, refId: 'rem:new', originalPaise: 200, remainingPaise: 200, consumedBy: [], createdAt: '2026-09-01' };
    const credit1Round2Consumed = rows.slice(0, 99).map((r) => ({ bookingId: r.entry.bookingId, paise: 10, appliedAt: 't' }));

    vi.mocked(commissionReceivableRepo.getOpenCredits)
      .mockResolvedValueOnce([{ doc: credit1, etag: '"c1"' }, { doc: credit2, etag: '"c2"' }])
      .mockResolvedValueOnce([{ doc: { ...credit1, remainingPaise: 10, consumedBy: credit1Round2Consumed }, etag: '"c1v2"' }]);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician)
      .mockResolvedValueOnce(rows)              // credit1 batch 1: 120 rows available, cap takes 99
      .mockResolvedValueOnce(rows.slice(99))    // credit1 batch 2: 21 rows left, takes 1 (b099)
      .mockResolvedValueOnce(rows.slice(100));  // credit2 batch 1: 20 rows left
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });

    const r = await consumePendingCredits('t1');

    expect(r.consumedPaise).toBe(1200);
    expect(commissionReceivableRepo.runLedgerBatch).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls;
    const creditIdOf = (ops: unknown[]) => (ops[0] as unknown as { resourceBody: { id: string } }).resourceBody.id;
    expect(creditIdOf(calls[0]![1])).toBe('cr:rem:old');
    expect(creditIdOf(calls[1]![1])).toBe('cr:rem:old'); // still the older credit — not yet exhausted
    expect(creditIdOf(calls[2]![1])).toBe('cr:rem:new'); // newer credit only after the older reaches remainingPaise 0
  });
  it('recomputes remainingPaise absolutely from originalPaise minus ALL consumedBy entries, ignoring a stale remainingPaise field', async () => {
    const staleCredit = {
      id: 'cr:rem:stale', docType: 'CREDIT' as const, technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT' as const, refId: 'rem:stale',
      originalPaise: 100,
      remainingPaise: 100, // deliberately inconsistent with consumedBy below (simulates stale/pre-existing data)
      consumedBy: [{ bookingId: 'bOld', paise: 30, appliedAt: '2026-08-01' }],
      createdAt: '2026-08-01',
    };
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([{ doc: staleCredit, etag: '"c1"' }]);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b9', 70, '2026-09-05')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });

    const r = await consumePendingCredits('t1');

    expect(r.consumedPaise).toBe(70);
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    const creditBody = (ops[0] as unknown as { resourceBody: { remainingPaise: number; consumedBy: unknown[] } }).resourceBody;
    // absolute: 100 (original) - (30 old + 70 new) = 0 — NOT the stale-relative "100 (stored) - 70 (applied) = 30"
    expect(creditBody.remainingPaise).toBe(0);
    expect(creditBody.consumedBy).toHaveLength(2);
  });
});

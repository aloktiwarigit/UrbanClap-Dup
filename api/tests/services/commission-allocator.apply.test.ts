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
  it('treats a 409 on the anchor as an idempotent replay', async () => {
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b1', 200, '2026-09-01')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: false, reason: 'CONFLICT' });
    expect(await applyCredit({ ...base, paise: 100 })).toEqual({ replayed: true, anchorId: 'rem:k1' });
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
  it('applies open credits oldest-first against DUE rows and updates remainingPaise absolutely', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([{ doc: { id: 'cr:rem:k1', docType: 'CREDIT', technicianId: 't1', partitionKey: 't1', source: 'OVERPAYMENT', refId: 'rem:k1', originalPaise: 100, remainingPaise: 100, consumedBy: [], createdAt: '2026-09-01' }, etag: '"c1"' }]);
    vi.mocked(commissionReceivableRepo.getOutstandingByTechnician).mockResolvedValue([row('b9', 60, '2026-09-05')]);
    vi.mocked(commissionReceivableRepo.runLedgerBatch).mockResolvedValue({ ok: true });
    const r = await consumePendingCredits('t1');
    expect(r.consumedPaise).toBe(60);
    const ops = vi.mocked(commissionReceivableRepo.runLedgerBatch).mock.calls[0]![1];
    expect(ops.map((o) => o.operationType)).toEqual(['Replace', 'Replace']); // credit doc + receivable
    expect((ops[0] as unknown as { resourceBody: { remainingPaise: number; consumedBy: unknown[] } }).resourceBody).toMatchObject({ remainingPaise: 40 });
  });
  it('is a no-op with no open credits or no DUE rows', async () => {
    vi.mocked(commissionReceivableRepo.getOpenCredits).mockResolvedValue([]);
    expect(await consumePendingCredits('t1')).toEqual({ consumedPaise: 0 });
    expect(commissionReceivableRepo.runLedgerBatch).not.toHaveBeenCalled();
  });
});

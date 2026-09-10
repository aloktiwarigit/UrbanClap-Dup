// api/tests/services/incentive.apply.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/services/commission-allocator.service.js');
vi.mock('../../src/services/commission-hold.service.js');
vi.mock('../../src/cosmos/system-docs-repository.js');
vi.mock('../../src/cosmos/incentive-repository.js');
vi.mock('../../src/cosmos/commission-receivable-repository.js');
import { applyCredit, consumePendingCredits } from '../../src/services/commission-allocator.service.js';
import { recomputeCommissionHold } from '../../src/services/commission-hold.service.js';
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { incentiveRepo } from '../../src/cosmos/incentive-repository.js';
import { applyAward } from '../../src/services/incentive.service.js';

const cfg = {
  enabled: true, milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900,
};
const jobs = (n: number, amount = 100_000) =>
  Array.from({ length: n }, (_, i) => ({
    bookingId: `b${i}`, bookingAmount: amount,
    commissionDue: Math.round(amount * 0.22), createdAt: '2026-09-09T10:00:00.000Z',
  }));
const base = { technicianId: 't1', weekKey: '2026-W37', cfg, byId: 'system:incentive' };
const ok = (over: Record<string, unknown> = {}) => ({
  replayed: false as const, anchorId: 'inc:t1:2026-W37',
  allocations: [] as Array<{ bookingId: string; paise: number }>, creditCreatedPaise: 0, ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(recomputeCommissionHold).mockResolvedValue({ hold: null } as never);
  vi.mocked(incentiveRepo.getAwardWithEtag).mockResolvedValue(null);
});

describe('applyAward — no award', () => {
  it('writes NOTHING when no milestone is reached, or when the cap zeroes the award', async () => {
    expect((await applyAward({ ...base, receivables: jobs(3) })).outcome).toBe('NO_AWARD');
    expect((await applyAward({ ...base, receivables: jobs(10), cfg: { ...cfg, capFractionBps: 0 } })).outcome).toBe('NO_AWARD');
    expect(applyCredit).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });
});

describe('applyAward — the award document is the allocator anchor', () => {
  it('passes source INCENTIVE, refId = awardId, and never mentions a remittance', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 22_000 }], creditCreatedPaise: 8_000 }));
    await applyAward({ ...base, receivables: jobs(10) });
    const arg = vi.mocked(applyCredit).mock.calls[0]![0];
    expect(arg).toMatchObject({ source: 'INCENTIVE', refId: 'inc:t1:2026-W37', paise: 30_000 });
    expect(arg.anchor.id).toBe('inc:t1:2026-W37');
    const doc = arg.anchor.build({ allocations: [{ bookingId: 'b0', paise: 22_000 }], leftoverPaise: 8_000 });
    expect(doc['docType']).toBe('INCENTIVE_AWARD');
    expect(JSON.stringify(doc)).not.toContain('REMITTANCE'); // spec §6, §11
  });
  it('snapshots the milestone table, cap and threshold onto the award', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    await applyAward({ ...base, receivables: jobs(10) });
    const doc = vi.mocked(applyCredit).mock.calls[0]![0].anchor.build({ allocations: [], leftoverPaise: 30_000 });
    expect(doc).toMatchObject({
      milestoneSnapshot: cfg.milestones, capFractionBpsSnapshot: 6000,
      minCountableBookingPaiseSnapshot: 24_900, reachedMilestone: { jobs: 10, bonusPaise: 30_000 },
    });
  });
  it('sets appliedPaise from the ACTUAL plan, derives status from it, and carries no payout field', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok());
    await applyAward({ ...base, receivables: jobs(10) });
    const build = vi.mocked(applyCredit).mock.calls[0]![0].anchor.build;
    expect(build({ allocations: [], leftoverPaise: 30_000 })).toMatchObject({ appliedPaise: 0, status: 'AWARDED' });
    expect(build({ allocations: [{ bookingId: 'b0', paise: 12_000 }], leftoverPaise: 18_000 }))
      .toMatchObject({ appliedPaise: 12_000, status: 'PARTIAL' });
    const full = build({ allocations: [{ bookingId: 'b0', paise: 22_000 }, { bookingId: 'b1', paise: 8_000 }], leftoverPaise: 0 });
    expect(full).toMatchObject({ appliedPaise: 30_000, status: 'APPLIED' });
    expect(Object.keys(full).filter((k) => /payout|payable|transfer|razorpay/i.test(k))).toEqual([]);
  });
});

describe('applyAward — anchor.matches', () => {
  it('PROOF: a rerun after a config edit is a REPLAY, not an IDEMPOTENCY_MISMATCH', async () => {
    // Stored award was priced 30_000; the config has since changed and this run recomputes
    // 45_000. Spec §3.5: config edits never re-price history, so this must read "already
    // awarded". Comparing amounts — the allocator's fail-closed default — would throw and leave
    // that technician permanently red on every future run.
    vi.mocked(applyCredit).mockResolvedValue({ replayed: true, anchorId: 'inc:t1:2026-W37' });
    const r = await applyAward({ ...base, receivables: jobs(10) });
    expect(r.outcome).toBe('REPLAYED');
    const matches = vi.mocked(applyCredit).mock.calls[0]![0].anchor.matches!;
    expect(matches({ technicianId: 't1', weekKey: '2026-W37', awardedPaise: 45_000 })).toBe(true);
    expect(matches({ technicianId: 't2', weekKey: '2026-W37' })).toBe(false);
    expect(matches({ technicianId: 't1', weekKey: '2026-W36' })).toBe(false);
    expect(matches({})).toBe(false);
  });
  it('does not recompute the hold or consume credits on a replay', async () => {
    vi.mocked(applyCredit).mockResolvedValue({ replayed: true, anchorId: 'inc:t1:2026-W37' });
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).not.toHaveBeenCalled();
    expect(recomputeCommissionHold).not.toHaveBeenCalled();
  });
});

describe('applyAward — after the batch commits', () => {
  it('consumes the leftover credit only when one was created', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    vi.mocked(consumePendingCredits).mockResolvedValue({ consumedPaise: 0 });
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).toHaveBeenCalledWith('t1');
    vi.mocked(consumePendingCredits).mockClear();
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 30_000 }] }));
    await applyAward({ ...base, receivables: jobs(10) });
    expect(consumePendingCredits).not.toHaveBeenCalled();
  });
  it('never fails the award when the hold recompute throws — queues a repair instead', async () => {
    // The batch already committed; the money moved. A hold-cache failure must not undo that.
    vi.mocked(applyCredit).mockResolvedValue(ok({ allocations: [{ bookingId: 'b0', paise: 30_000 }] }));
    vi.mocked(recomputeCommissionHold).mockRejectedValue(new Error('cosmos down'));
    vi.mocked(systemDocsRepo.enqueueHoldRepair).mockResolvedValue(undefined);
    const r = await applyAward({ ...base, receivables: jobs(10) });
    expect(r).toMatchObject({ outcome: 'AWARDED', holdRecomputePending: true });
    expect(systemDocsRepo.enqueueHoldRepair).toHaveBeenCalledWith(['t1']);
  });
  it('never fails the award when consumePendingCredits throws', async () => {
    vi.mocked(applyCredit).mockResolvedValue(ok({ creditCreatedPaise: 30_000 }));
    vi.mocked(consumePendingCredits).mockRejectedValue(new Error('boom'));
    expect((await applyAward({ ...base, receivables: jobs(10) })).outcome).toBe('AWARDED');
  });
  it('propagates a PRECONDITION from the allocator — a genuinely failed batch is not an award', async () => {
    vi.mocked(applyCredit).mockRejectedValue(Object.assign(new Error('PRECONDITION'), { code: 'PRECONDITION' }));
    await expect(applyAward({ ...base, receivables: jobs(10) })).rejects.toMatchObject({ code: 'PRECONDITION' });
  });
});

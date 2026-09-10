// api/tests/services/incentive.run.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/cosmos/system-docs-repository.js');
vi.mock('../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../src/services/auditLog.service.js');
import { systemDocsRepo } from '../../src/cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../src/cosmos/commission-receivable-repository.js';
import { systemAudit } from '../../src/services/auditLog.service.js';
import * as incentive from '../../src/services/incentive.service.js';

const cfg = { enabled: true, milestones: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900 };
const awardedRes = (t: string) => ({ technicianId: t, weekKey: '2026-W37', outcome: 'AWARDED' as const,
  awardId: `inc:${t}:2026-W37`, awardedPaise: 30_000, allocations: [{ bookingId: 'b0', paise: 22_000 }],
  creditCreatedPaise: 8_000, holdRecomputePending: false });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
  vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
  vi.mocked(systemAudit).mockResolvedValue(undefined);
});

describe('runIncentiveWeek', () => {
  it('does NOTHING when incentives are disabled — not even the roster query', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false });
    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer'))
      .toMatchObject({ enabled: false, technicianCount: 0, awarded: 0 });
    expect(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).not.toHaveBeenCalled();
  });

  it('queries the roster with the half-open UTC bounds of that IST week', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([]);
    await incentive.runIncentiveWeek('2026-W37', 'system:timer');
    expect(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow)
      .toHaveBeenCalledWith('2026-09-06T18:30:00.000Z', '2026-09-13T18:30:00.000Z');
  });

  it('tallies AWARDED, REPLAYED and NO_AWARD separately and audits only genuine awards', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 },
      { technicianId: 't2', receivableCount: 10 },
      { technicianId: 't3', receivableCount: 2 },
    ]);
    vi.spyOn(incentive, 'applyAward')
      .mockResolvedValueOnce(awardedRes('t1'))
      .mockResolvedValueOnce({ technicianId: 't2', weekKey: '2026-W37', outcome: 'REPLAYED', awardId: 'inc:t2:2026-W37' })
      .mockResolvedValueOnce({ technicianId: 't3', weekKey: '2026-W37', outcome: 'NO_AWARD',
        computed: { countedJobs: 2, countedCommissionPaise: 44_000, grossBonusPaise: 0, capPaise: 26_400, awardedPaise: 0 } });

    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer')).toMatchObject({
      enabled: true, technicianCount: 3, awarded: 1, replayed: 1, noAward: 1, failed: 0, totalAwardedPaise: 30_000,
    });
    expect(systemAudit).toHaveBeenCalledTimes(1);
    expect(systemAudit).toHaveBeenCalledWith('INCENTIVE_AWARDED', 'incentive_award', 'inc:t1:2026-W37',
      expect.objectContaining({ technicianId: 't1', weekKey: '2026-W37', awardedPaise: 30_000 }));
  });

  it('PROOF: a rerun of an already-awarded week is a NO-OP', async () => {
    // Verification scenario §9 item 6, final clause: "rerun no-op". Everyone comes back REPLAYED,
    // nothing is awarded, and no second INCENTIVE_AWARDED entry appears — the owner's audit trail
    // would otherwise show the same bonus granted twice.
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 }, { technicianId: 't2', receivableCount: 12 },
    ]);
    vi.spyOn(incentive, 'applyAward').mockImplementation(async (i) =>
      ({ technicianId: i.technicianId, weekKey: i.weekKey, outcome: 'REPLAYED', awardId: `inc:${i.technicianId}:${i.weekKey}` }));
    expect(await incentive.runIncentiveWeek('2026-W37', 'admin-1'))
      .toMatchObject({ awarded: 0, replayed: 2, failed: 0, totalAwardedPaise: 0 });
    expect(systemAudit).not.toHaveBeenCalled();
  });

  it('one technician failing does not abort the run', async () => {
    vi.mocked(commissionReceivableRepo.listTechnicianIdsWithReceivablesInWindow).mockResolvedValue([
      { technicianId: 't1', receivableCount: 10 }, { technicianId: 't2', receivableCount: 10 },
    ]);
    vi.spyOn(incentive, 'applyAward')
      .mockRejectedValueOnce(Object.assign(new Error('PRECONDITION'), { code: 'PRECONDITION' }))
      .mockResolvedValueOnce(awardedRes('t2'));
    expect(await incentive.runIncentiveWeek('2026-W37', 'system:timer')).toMatchObject({ failed: 1, awarded: 1 });
  });

  it('rejects a malformed week key before touching anything', async () => {
    await expect(incentive.runIncentiveWeek('2026-37', 'system:timer')).rejects.toThrow(/invalid IST week key/);
    expect(systemDocsRepo.getEffectiveIncentiveConfig).not.toHaveBeenCalled();
  });
});

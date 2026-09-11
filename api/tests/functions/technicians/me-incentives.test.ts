import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../src/middleware/verifyTechnicianToken.js');
vi.mock('../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../src/cosmos/incentive-repository.js');
vi.mock('@sentry/node', () => ({ captureException: vi.fn() }));
import * as Sentry from '@sentry/node';
import { verifyTechnicianToken } from '../../../src/middleware/verifyTechnicianToken.js';
import { systemDocsRepo } from '../../../src/cosmos/system-docs-repository.js';
import { commissionReceivableRepo } from '../../../src/cosmos/commission-receivable-repository.js';
import { incentiveRepo } from '../../../src/cosmos/incentive-repository.js';
import { getTechnicianIncentivesHandler } from '../../../src/functions/technicians/me-incentives.js';

const cfg = { enabled: true, milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }],
  capFractionBps: 6000, minCountableBookingPaise: 24_900 };
const now = new Date('2026-09-09T10:00:00.000Z'); // Wed of 2026-W37
const receivable = (i: number) => ({ id: `b${i}`, bookingId: `b${i}`, technicianId: 't1', partitionKey: 't1',
  serviceId: 's', categoryId: 'c', bookingAmount: 100_000, commissionBps: 2200, commissionDue: 22_000,
  commissionResolvedFrom: 'GLOBAL' as const, remittanceStatus: 'DUE' as const, createdAt: '2026-09-08T10:00:00.000Z' });
// A well-formed award doc — satisfies IncentiveAwardDocSchema's ~15 required fields, so
// per-award validation in the handler passes it through.
const validAward = (i: number) => ({
  id: `a${i}`, docType: 'INCENTIVE_AWARD' as const, technicianId: 't1', partitionKey: 't1',
  weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
  countedJobs: 10, countedCommissionPaise: 220_000,
  milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
  reachedMilestone: { jobs: 10, bonusPaise: 30_000 },
  grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000,
  appliedPaise: 0, status: 'AWARDED' as const, computedAt: `2026-09-${String(14 - i).padStart(2, '0')}T00:30:00.000Z`,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers().setSystemTime(now);
  vi.mocked(verifyTechnicianToken).mockResolvedValue({ uid: 't1' } as never);
  vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
  vi.mocked(incentiveRepo.listAwards).mockResolvedValue([]);
});

describe('GET /v1/technicians/me/incentives', () => {
  it('401s without a valid technician token, before any read', async () => {
    vi.mocked(verifyTechnicianToken).mockRejectedValue(new Error('nope'));
    expect(await getTechnicianIncentivesHandler({} as never, {} as never)).toMatchObject({ status: 401 });
    expect(commissionReceivableRepo.getAllByTechnician).not.toHaveBeenCalled();
  });

  it('reports live current-week progress and the next milestone', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => receivable(i)) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['currentWeek']).toMatchObject({
      weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
      countedJobs: 6, countedCommissionPaise: 132_000,
      nextMilestone: { jobs: 10, bonusPaise: 30_000 }, jobsToNextMilestone: 4,
      projectedBonusPaise: 10_000, // the 5-job milestone, uncapped at 6000 bps
    });
  });

  it('shows the cap when it currently binds, so the number is never a promise the cap will break', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ ...receivable(i), bookingAmount: 24_900, commissionDue: 5_478 })) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    // 5 x 5_478 = 27_390 generated; cap = floor(*0.6) = 16_434 < the 10_000 milestone -> not binding.
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedCapPaise: 16_434, projectedBonusPaise: 10_000 });
  });

  it('omits nextMilestone once the top milestone is reached', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => receivable(i)) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['currentWeek']).not.toHaveProperty('nextMilestone');
  });

  it('returns at most the last 8 awards, newest first', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
    vi.mocked(incentiveRepo.listAwards).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => validAward(i)) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: { awards: unknown[] } };
    expect(res.jsonBody.awards).toHaveLength(8);
  });

  it('drops a malformed award and reports it to Sentry, but keeps a valid sibling', async () => {
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([]);
    const malformed = { id: 'a-bad' }; // missing ~15 required IncentiveAwardDocSchema fields
    vi.mocked(incentiveRepo.listAwards).mockResolvedValue([validAward(0), malformed] as never);

    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as
      { jsonBody: { awards: Array<{ id: string }> } };

    expect(res.jsonBody.awards).toHaveLength(1);
    expect(res.jsonBody.awards[0]?.id).toBe('a0');
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ extra: expect.objectContaining({ technicianId: 't1', awardId: 'a-bad' }) }),
    );
  });

  it('reports enabled:false with zeroed progress when the programme is dark and milestones are empty', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false, milestones: [] });
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([receivable(0)] as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['enabled']).toBe(false);
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedBonusPaise: 0 });
  });

  it('Codex regression: does NOT project a bonus/milestone once disabled, even with a real milestone table and enough jobs to qualify', async () => {
    // The case above (milestones: []) would pass identically whether or not `enabled` were
    // ever checked -- computeWeek finds nothing to award against an empty table regardless.
    // This is the actual bug shape Codex flagged: an admin disables the programme AFTER
    // configuring real milestones, so `cfg.milestones` still has entries. Same receivable
    // fixture as "reports live current-week progress..." above (6 jobs, on track for the
    // 5-job/10_000-paise milestone) -- if this handler still computed against the stale
    // table, it would report the same nextMilestone/projectedBonusPaise as that test.
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false });
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => receivable(i)) as never);

    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };

    expect(res.jsonBody['enabled']).toBe(false);
    // countedJobs/countedCommissionPaise are still factual counts of what happened this
    // week -- only the bonus PROJECTION (which the weekly run will never actually pay) is
    // suppressed.
    expect(res.jsonBody['currentWeek']).toMatchObject({ countedJobs: 6, countedCommissionPaise: 132_000 });
    expect(res.jsonBody['currentWeek']).not.toHaveProperty('nextMilestone');
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedBonusPaise: 0, projectedCapPaise: 0 });
  });
});

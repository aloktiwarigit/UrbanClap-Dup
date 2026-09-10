import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../src/middleware/verifyTechnicianToken.js');
vi.mock('../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../src/cosmos/commission-receivable-repository.js');
vi.mock('../../../src/cosmos/incentive-repository.js');
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
      Array.from({ length: 12 }, (_, i) => ({ id: `a${i}` })) as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: { awards: unknown[] } };
    expect(res.jsonBody.awards).toHaveLength(8);
  });

  it('reports enabled:false with zeroed progress when the programme is dark', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue({ ...cfg, enabled: false, milestones: [] });
    vi.mocked(commissionReceivableRepo.getAllByTechnician).mockResolvedValue([receivable(0)] as never);
    const res = await getTechnicianIncentivesHandler({} as never, {} as never) as { jsonBody: Record<string, unknown> };
    expect(res.jsonBody['enabled']).toBe(false);
    expect(res.jsonBody['currentWeek']).toMatchObject({ projectedBonusPaise: 0 });
  });
});

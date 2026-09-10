import { describe, it, expect } from 'vitest';
import {
  IncentiveAwardDocSchema, IncentiveAwardWriteSchema, UpdateIncentiveConfigBodySchema,
  IncentiveConfigDocSchema, toEffectiveIncentiveConfig, incentiveAwardId, INCENTIVE_CONFIG_DOC_ID,
} from '../../src/schemas/incentive.js';

const award = {
  id: 'inc:t1:2026-W37', docType: 'INCENTIVE_AWARD', technicianId: 't1', partitionKey: 't1',
  weekKey: '2026-W37', weekStart: '2026-09-07', weekEnd: '2026-09-13',
  countedJobs: 10, countedCommissionPaise: 220_000,
  milestoneSnapshot: [{ jobs: 10, bonusPaise: 30_000 }],
  capFractionBpsSnapshot: 6000, minCountableBookingPaiseSnapshot: 24_900,
  reachedMilestone: { jobs: 10, bonusPaise: 30_000 },
  grossBonusPaise: 30_000, capPaise: 132_000, awardedPaise: 30_000,
  appliedPaise: 0, status: 'AWARDED', computedAt: '2026-09-14T00:30:00.000Z',
};

describe('IncentiveAwardDocSchema (read path)', () => {
  it('parses a well-formed award', () => {
    expect(IncentiveAwardDocSchema.parse(award).awardedPaise).toBe(30_000);
  });
  it('tolerates the Cosmos system fields present on every stored document', () => {
    // A read-path schema that rejects _etag/_rid/_ts cannot parse anything Cosmos returns.
    const stored = { ...award, _rid: 'x', _etag: '"1"', _ts: 1, _self: 'y', _attachments: 'z' };
    expect(() => IncentiveAwardDocSchema.parse(stored)).not.toThrow();
  });
  it('rejects a malformed week key and a zero award', () => {
    expect(() => IncentiveAwardDocSchema.parse({ ...award, weekKey: '2026-37' })).toThrow();
    expect(() => IncentiveAwardDocSchema.parse({ ...award, awardedPaise: 0 })).toThrow();
  });
});

describe('IncentiveAwardWriteSchema — credit-only is structural', () => {
  it('parses the same well-formed award', () => {
    expect(() => IncentiveAwardWriteSchema.parse(award)).not.toThrow();
  });
  it('REJECTS an award carrying any payout-shaped field at the top level', () => {
    // The structural half of "credit-only, not by convention": a future edit that adds a payout
    // amount to the award cannot reach Cosmos, because the write parse throws here.
    for (const extra of [{ payoutPaise: 1 }, { netPayable: 1 }, { razorpayTransferId: 'trf_1' }]) {
      expect(() => IncentiveAwardWriteSchema.parse({ ...award, ...extra })).toThrow();
    }
  });
  it('REJECTS payout-shaped fields nested inside milestones', () => {
    // With MilestoneSchema.strict(), extra fields on nested milestones throw too, not just top-level.
    const badMilestone = { ...award, milestoneSnapshot: [{ jobs: 1, bonusPaise: 1, payoutPaise: 999 }] };
    expect(() => IncentiveAwardWriteSchema.parse(badMilestone)).toThrow();
    const badReached = { ...award, reachedMilestone: { jobs: 1, bonusPaise: 1, netPayable: 1 } };
    expect(() => IncentiveAwardWriteSchema.parse(badReached)).toThrow();
  });
});

describe('UpdateIncentiveConfigBodySchema', () => {
  const ok = (b: unknown) => UpdateIncentiveConfigBodySchema.safeParse(b).success;
  it('accepts strictly ascending milestones', () => {
    expect(ok({ milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }] })).toBe(true);
  });
  it('rejects milestones not ascending in jobs, or paying no more for more jobs', () => {
    expect(ok({ milestones: [{ jobs: 10, bonusPaise: 10_000 }, { jobs: 5, bonusPaise: 30_000 }] })).toBe(false);
    expect(ok({ milestones: [{ jobs: 5, bonusPaise: 30_000 }, { jobs: 10, bonusPaise: 30_000 }] })).toBe(false);
  });
  it('bounds the cap to [0, 10000] inclusive', () => {
    expect(ok({ capFractionBps: 0 })).toBe(true);
    expect(ok({ capFractionBps: 10_000 })).toBe(true);
    expect(ok({ capFractionBps: 10_001 })).toBe(false);
  });
  it('rejects an empty patch and unknown fields', () => {
    expect(ok({})).toBe(false);
    expect(ok({ enabled: true, nope: 1 })).toBe(false);
  });
});

describe('toEffectiveIncentiveConfig', () => {
  it('applies every default when the doc has never been written (dark launch)', () => {
    expect(toEffectiveIncentiveConfig(null)).toMatchObject({
      enabled: false, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
    });
  });
  it('sorts milestones ascending even if the stored doc is out of order', () => {
    const doc = IncentiveConfigDocSchema.parse({
      id: INCENTIVE_CONFIG_DOC_ID,
      enabled: true,
      milestones: [{ jobs: 10, bonusPaise: 30_000 }, { jobs: 5, bonusPaise: 10_000 }],
    });
    expect(toEffectiveIncentiveConfig(doc).milestones.map((m) => m.jobs)).toEqual([5, 10]);
  });
  it('builds the deterministic anchor id the allocator keys replay detection on', () => {
    expect(incentiveAwardId('t1', '2026-W37')).toBe('inc:t1:2026-W37');
  });
});

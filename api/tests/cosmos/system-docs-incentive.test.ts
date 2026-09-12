import { describe, it, expect, vi, beforeEach } from 'vitest';

const read = vi.fn();
const replace = vi.fn();
const create = vi.fn();
vi.mock('../../src/cosmos/client.js', () => ({
  getSystemContainer: () => ({ item: () => ({ read, replace }), items: { create } }),
}));
const { systemDocsRepo } = await import('../../src/cosmos/system-docs-repository.js');

beforeEach(() => vi.resetAllMocks());

describe('getEffectiveIncentiveConfig', () => {
  it('returns defaults when the doc has never been written (dark launch)', async () => {
    read.mockResolvedValue({ resource: undefined });
    expect(await systemDocsRepo.getEffectiveIncentiveConfig()).toMatchObject({
      enabled: false, milestones: [], capFractionBps: 6000, minCountableBookingPaise: 24_900,
    });
  });
  it('applies per-field defaults to a partially-populated stored doc', async () => {
    read.mockResolvedValue({ resource: { id: 'incentive-config', enabled: true } });
    const cfg = await systemDocsRepo.getEffectiveIncentiveConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.capFractionBps).toBe(6000);
  });
});

describe('patchIncentiveConfig', () => {
  it('merges under IfMatch and never drops a field the patch did not name', async () => {
    // The regression this exists for: upsertCommissionConfig used to rebuild a fixed-field doc
    // and wipe the thresholds (spec §5.3). A patch must never erase what it did not mention.
    read.mockResolvedValue({
      resource: { id: 'incentive-config', enabled: true, capFractionBps: 5000,
        milestones: [{ jobs: 10, bonusPaise: 30_000 }] },
      etag: '"v1"',
    });
    replace.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ capFractionBps: 7000 }, 'admin-1');
    expect(out).toMatchObject({ enabled: true, capFractionBps: 7000, updatedBy: 'admin-1',
      milestones: [{ jobs: 10, bonusPaise: 30_000 }] });
    expect(replace.mock.calls[0]![1]).toMatchObject({ accessCondition: { type: 'IfMatch', condition: '"v1"' } });
  });
  it('creates the doc on first write', async () => {
    read.mockResolvedValue({ resource: undefined });
    create.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ enabled: true }, 'admin-1');
    expect(create).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ enabled: true, capFractionBps: 6000 });
  });
  it('replaces the milestone table wholesale rather than merging element-wise', async () => {
    // The admin editor submits the whole table; an element-wise merge could never express a
    // deletion.
    read.mockResolvedValue({
      resource: { id: 'incentive-config', milestones: [{ jobs: 5, bonusPaise: 10_000 }, { jobs: 10, bonusPaise: 30_000 }] },
      etag: '"v1"',
    });
    replace.mockResolvedValue({});
    const out = await systemDocsRepo.patchIncentiveConfig({ milestones: [{ jobs: 8, bonusPaise: 20_000 }] }, 'a1');
    expect(out.milestones).toEqual([{ jobs: 8, bonusPaise: 20_000 }]);
  });
});

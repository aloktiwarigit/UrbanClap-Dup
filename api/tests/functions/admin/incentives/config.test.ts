import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/cosmos/system-docs-repository.js');
vi.mock('../../../../src/services/auditLog.service.js');
import { systemDocsRepo } from '../../../../src/cosmos/system-docs-repository.js';
import { auditLog } from '../../../../src/services/auditLog.service.js';
import { getIncentiveConfigHandler, putIncentiveConfigHandler } from '../../../../src/functions/admin/incentives/config.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const ctx = {} as never;
const req = (body: unknown) => ({ json: async () => body }) as never;
const cfg = { enabled: true, milestones: [{ jobs: 10, bonusPaise: 30_000 }], capFractionBps: 6000, minCountableBookingPaise: 24_900 };

beforeEach(() => { vi.resetAllMocks(); vi.mocked(auditLog).mockResolvedValue(undefined); });

describe('GET config', () => {
  it('returns the defaults-applied config and never 404s', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockResolvedValue(cfg);
    const res = await getIncentiveConfigHandler({} as never, ctx, admin);
    expect(res).toMatchObject({ status: 200, jsonBody: cfg });
  });
  it('502s on an upstream failure rather than leaking the error', async () => {
    vi.mocked(systemDocsRepo.getEffectiveIncentiveConfig).mockRejectedValue(new Error('cosmos'));
    expect(await getIncentiveConfigHandler({} as never, ctx, admin)).toMatchObject({ status: 502 });
  });
});

describe('PUT config', () => {
  it('patches, audits INCENTIVE_CONFIG_UPDATED, and returns the merged config', async () => {
    vi.mocked(systemDocsRepo.patchIncentiveConfig).mockResolvedValue({ ...cfg, capFractionBps: 5000 });
    const res = await putIncentiveConfigHandler(req({ capFractionBps: 5000 }), ctx, admin);
    expect(res).toMatchObject({ status: 200 });
    expect(systemDocsRepo.patchIncentiveConfig).toHaveBeenCalledWith({ capFractionBps: 5000 }, 'a1');
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'a1' }), 'INCENTIVE_CONFIG_UPDATED',
      'incentive-config', 'incentive-config', { patch: { capFractionBps: 5000 } });
  });
  it('400s on a malformed body, an empty patch, or non-ascending milestones — and never writes', async () => {
    for (const body of [
      { capFractionBps: 10_001 },
      {},
      { milestones: [{ jobs: 10, bonusPaise: 30_000 }, { jobs: 5, bonusPaise: 10_000 }] },
      { unknownField: 1 },
    ]) {
      expect(await putIncentiveConfigHandler(req(body), ctx, admin)).toMatchObject({ status: 400 });
    }
    expect(systemDocsRepo.patchIncentiveConfig).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });
  it('400s with PARSE_ERROR on unparseable JSON', async () => {
    const bad = { json: async () => { throw new Error('bad'); } } as never;
    expect(await putIncentiveConfigHandler(bad, ctx, admin)).toMatchObject({ status: 400, jsonBody: { code: 'PARSE_ERROR' } });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/cosmos/incentive-repository.js');
import { incentiveRepo } from '../../../../src/cosmos/incentive-repository.js';
import { listIncentiveAwardsHandler } from '../../../../src/functions/admin/incentives/awards.js';

const admin = { adminId: 'a1', role: 'finance' as const, sessionId: 's1' };
const req = (q: Record<string, string>) => ({ query: new URLSearchParams(q) }) as never;

beforeEach(() => vi.resetAllMocks());

describe('GET awards', () => {
  it('forwards all three filters to the repository and returns the page', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockResolvedValue({ awards: [], continuationToken: 'ct-2' });
    const res = await listIncentiveAwardsHandler(
      req({ week: '2026-W37', technicianId: 't1', continuationToken: 'ct-1' }), {} as never, admin);
    expect(res).toMatchObject({ status: 200, jsonBody: { awards: [], continuationToken: 'ct-2' } });
    expect(incentiveRepo.listAwardsCrossPartition)
      .toHaveBeenCalledWith({ weekKey: '2026-W37', technicianId: 't1', continuationToken: 'ct-1' });
  });
  it('omits absent filters rather than passing empty strings into the query', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockResolvedValue({ awards: [] });
    await listIncentiveAwardsHandler(req({}), {} as never, admin);
    expect(incentiveRepo.listAwardsCrossPartition).toHaveBeenCalledWith({});
  });
  it('400s on a malformed week and never queries', async () => {
    expect(await listIncentiveAwardsHandler(req({ week: '2026-37' }), {} as never, admin))
      .toMatchObject({ status: 400, jsonBody: { code: 'VALIDATION_ERROR' } });
    expect(incentiveRepo.listAwardsCrossPartition).not.toHaveBeenCalled();
  });
  it('502s on an upstream failure', async () => {
    vi.mocked(incentiveRepo.listAwardsCrossPartition).mockRejectedValue(new Error('cosmos'));
    expect(await listIncentiveAwardsHandler(req({}), {} as never, admin)).toMatchObject({ status: 502 });
  });
});

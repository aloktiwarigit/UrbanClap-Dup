import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../../src/services/incentive.service.js');
import { runIncentiveWeek } from '../../../../src/services/incentive.service.js';
import { runIncentivesHandler } from '../../../../src/functions/admin/incentives/run.js';

const admin = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const req = (q: Record<string, string>) => ({ query: new URLSearchParams(q) }) as never;
const summary = { weekKey: '2026-W37', enabled: true, technicianCount: 3, awarded: 1,
  replayed: 1, noAward: 1, failed: 0, totalAwardedPaise: 30_000 };

beforeEach(() => vi.resetAllMocks());

describe('POST run', () => {
  it('runs the named week as the calling admin and returns the summary', async () => {
    vi.mocked(runIncentiveWeek).mockResolvedValue(summary);
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin))
      .toMatchObject({ status: 200, jsonBody: summary });
    expect(runIncentiveWeek).toHaveBeenCalledWith('2026-W37', 'a1');
  });
  it('defaults to the PREVIOUS IST week when none is given', async () => {
    // Same default as the Monday timer, so a manual re-run right after a failed timer needs no
    // argument and cannot accidentally award a week that is still in progress.
    vi.mocked(runIncentiveWeek).mockResolvedValue(summary);
    await runIncentivesHandler(req({}), {} as never, admin);
    const [weekKey] = vi.mocked(runIncentiveWeek).mock.calls[0]!;
    expect(weekKey).toMatch(/^\d{4}-W\d{2}$/);
  });
  it('400s on a malformed week and never runs', async () => {
    expect(await runIncentivesHandler(req({ week: 'nope' }), {} as never, admin)).toMatchObject({ status: 400 });
    expect(runIncentiveWeek).not.toHaveBeenCalled();
  });
  it('surfaces a disabled programme as 200 with enabled:false, not as an error', async () => {
    vi.mocked(runIncentiveWeek).mockResolvedValue({ ...summary, enabled: false, technicianCount: 0, awarded: 0, replayed: 0, noAward: 0, totalAwardedPaise: 0 });
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin))
      .toMatchObject({ status: 200, jsonBody: { enabled: false } });
  });
  it('502s when the run throws', async () => {
    vi.mocked(runIncentiveWeek).mockRejectedValue(new Error('cosmos'));
    expect(await runIncentivesHandler(req({ week: '2026-W37' }), {} as never, admin)).toMatchObject({ status: 502 });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../../src/services/incentive.service.js');
import { runIncentiveWeek } from '../../../src/services/incentive.service.js';
import { runWeeklyIncentives } from '../../../src/functions/trigger-incentive-weekly.js';
import { readFileSync } from 'node:fs';

const ctx = { log: vi.fn(), error: vi.fn() } as never;
beforeEach(() => vi.resetAllMocks());

describe('runWeeklyIncentives', () => {
  it('runs the PREVIOUS IST week as system:incentive-timer', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-13T19:00:00.000Z')); // Mon 2026-09-14 00:30 IST
    vi.mocked(runIncentiveWeek).mockResolvedValue({ weekKey: '2026-W37', enabled: true,
      technicianCount: 2, awarded: 1, replayed: 0, noAward: 1, failed: 0, totalAwardedPaise: 30_000 });
    await runWeeklyIncentives(ctx);
    // The week that just ended, never the one starting 30 minutes ago.
    expect(runIncentiveWeek).toHaveBeenCalledWith('2026-W37', 'system:incentive-timer');
  });
  it('rethrows so the Functions host records a failed invocation', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-09-13T19:00:00.000Z'));
    vi.mocked(runIncentiveWeek).mockRejectedValue(new Error('cosmos'));
    await expect(runWeeklyIncentives(ctx)).rejects.toThrow('cosmos');
  });
  it('is scheduled at Sunday 19:00 UTC, which is Monday 00:30 IST', () => {
    const src = readFileSync('src/functions/trigger-incentive-weekly.ts', 'utf8');
    expect(src).toMatch(/schedule:\s*'0 0 19 \* \* 0'/);
  });
});

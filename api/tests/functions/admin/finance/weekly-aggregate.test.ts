import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/cosmos/finance-repository.js', () => ({
  getPayoutQueue: vi.fn(),
  upsertWeekSnapshot: vi.fn(),
}));

import { weeklyPayoutAggregateHandler } from '../../../../src/functions/admin/finance/weekly-aggregate.js';
import { getPayoutQueue, upsertWeekSnapshot } from '../../../../src/cosmos/finance-repository.js';

const fakeCtx = { log: vi.fn() } as any;
const fakeTimer = {} as any;

describe('weeklyPayoutAggregateHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('computes prior-week Mon–Sun range and upserts snapshot', async () => {
    vi.useFakeTimers();
    // Monday 2026-04-21 01:00:00 UTC (cron fires at 00:30 UTC)
    vi.setSystemTime(new Date('2026-04-21T01:00:00.000Z'));

    const queue = { weekStart: '2026-04-14', weekEnd: '2026-04-20', entries: [], totalNetPayable: 0 };
    vi.mocked(getPayoutQueue).mockResolvedValue(queue);

    await weeklyPayoutAggregateHandler(fakeTimer, fakeCtx);

    expect(getPayoutQueue).toHaveBeenCalledWith('2026-04-14', '2026-04-20');
    expect(upsertWeekSnapshot).toHaveBeenCalledWith(queue);

    vi.useRealTimers();
  });

  it('upserts snapshot even when queue is empty', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T01:00:00.000Z'));
    vi.mocked(getPayoutQueue).mockResolvedValue({
      weekStart: '2026-04-14', weekEnd: '2026-04-20', entries: [], totalNetPayable: 0,
    });

    await weeklyPayoutAggregateHandler(fakeTimer, fakeCtx);
    expect(upsertWeekSnapshot).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});

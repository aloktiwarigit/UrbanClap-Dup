import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../../../src/cosmos/finance-repository.js', () => ({
  getPayoutQueue: vi.fn(),
  getWeekSnapshot: vi.fn(),
}));
vi.mock('../../../../src/services/adminSession.service.js', () => ({
  touchAndGetSession: vi.fn().mockResolvedValue({ sessionId: 's1' }),
}));

import { HttpRequest } from '@azure/functions';
import { adminPayoutQueueHandler } from '../../../../src/functions/admin/finance/payout-queue.js';
import { getPayoutQueue, getWeekSnapshot } from '../../../../src/cosmos/finance-repository.js';

const ctx = { adminId: 'a1', role: 'super-admin' as const, sessionId: 's1' };
const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/payout-queue', method: 'GET' });
const sampleQueue = { weekStart: '2026-04-14', weekEnd: '2026-04-20', entries: [], totalNetPayable: 0 };

describe('adminPayoutQueueHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns snapshot when one exists for current week — skips live query', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(sampleQueue);
    const res = await adminPayoutQueueHandler(req, {} as any, ctx);
    expect(res.status).toBe(200);
    expect(getPayoutQueue).not.toHaveBeenCalled();
  });

  it('falls back to live computation when no snapshot', async () => {
    vi.mocked(getWeekSnapshot).mockResolvedValue(null);
    vi.mocked(getPayoutQueue).mockResolvedValue(sampleQueue);
    const res = await adminPayoutQueueHandler(req, {} as any, ctx);
    expect(res.status).toBe(200);
    expect(getPayoutQueue).toHaveBeenCalledOnce();
  });
});

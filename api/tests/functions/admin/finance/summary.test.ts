import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../../../src/cosmos/finance-repository.js', () => ({ getDailyPnL: vi.fn() }));
vi.mock('../../../../src/services/adminSession.service.js', () => ({ touchAndGetSession: vi.fn() }));

import { HttpRequest } from '@azure/functions';
import { adminFinanceSummaryHandler } from '../../../../src/functions/admin/finance/summary.js';
import { getDailyPnL } from '../../../../src/cosmos/finance-repository.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';

describe('adminFinanceSummaryHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when from/to are missing', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when date format is invalid', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=01-04-2026&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'ops-manager', sessionId: 's1' },
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 with summary for finance role', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    const summary = { dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0 };
    vi.mocked(getDailyPnL).mockResolvedValue(summary);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=2026-04-01&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect(res.status).toBe(200);
    expect(getDailyPnL).toHaveBeenCalledWith('2026-04-01', '2026-04-30');
  });
});

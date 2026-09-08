import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-minimum-32-chars!!';

vi.mock('../../../../src/cosmos/finance-repository.js', () => ({ getDailyPnL: vi.fn() }));
vi.mock('../../../../src/services/adminSession.service.js', () => ({ touchAndGetSession: vi.fn() }));
vi.mock('../../../../src/shared/payouts-enabled.js', () => ({ arePayoutsEnabled: vi.fn() }));

import { HttpRequest } from '@azure/functions';
import { adminFinanceSummaryHandler } from '../../../../src/functions/admin/finance/summary.js';
import { getDailyPnL } from '../../../../src/cosmos/finance-repository.js';
import { touchAndGetSession } from '../../../../src/services/adminSession.service.js';
import { arePayoutsEnabled } from '../../../../src/shared/payouts-enabled.js';

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
    vi.mocked(arePayoutsEnabled).mockReturnValue(false);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=2026-04-01&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect(res.status).toBe(200);
    expect(getDailyPnL).toHaveBeenCalledWith('2026-04-01', '2026-04-30');
  });

  // Task 10 (E21-S03): admin-web hides the Payout Queue when this is false, since the cash-only
  // pilot has no working payout mechanism for it to queue anything into. This must be sourced
  // from arePayoutsEnabled() — the same function approve-payouts.ts and the prepaid-payout
  // timers already gate on — not a second, independently-read env var.
  it('includes payoutsEnabled sourced from arePayoutsEnabled() when true', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    vi.mocked(getDailyPnL).mockResolvedValue({ dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0 });
    vi.mocked(arePayoutsEnabled).mockReturnValue(true);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=2026-04-01&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect((res.jsonBody as any).payoutsEnabled).toBe(true);
  });

  it('includes payoutsEnabled: false when payouts are disabled (the cash-pilot default)', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    vi.mocked(getDailyPnL).mockResolvedValue({ dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0 });
    vi.mocked(arePayoutsEnabled).mockReturnValue(false);
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=2026-04-01&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect((res.jsonBody as any).payoutsEnabled).toBe(false);
    // The rest of the summary shape is untouched by this additive field.
    expect(res.jsonBody).toMatchObject({ dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0 });
  });

  it('returns 502 when getDailyPnL throws', async () => {
    vi.mocked(touchAndGetSession).mockResolvedValue({ sessionId: 's1' } as any);
    vi.mocked(getDailyPnL).mockRejectedValue(new Error('cosmos timeout'));
    const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/finance/summary?from=2026-04-01&to=2026-04-30', method: 'GET' });
    const res = await adminFinanceSummaryHandler(
      req, {} as any,
      { adminId: 'a1', role: 'finance', sessionId: 's1' },
    );
    expect(res.status).toBe(502);
    expect((res.jsonBody as any).code).toBe('UPSTREAM_ERROR');
  });
});

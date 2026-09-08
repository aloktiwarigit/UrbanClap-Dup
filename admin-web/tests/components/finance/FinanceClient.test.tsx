import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FinanceClient } from '../../../src/components/finance/FinanceClient';
import type { FinanceSummary, PayoutQueue } from '../../../src/api/finance';

// Task 10 (E21-S03): the pilot is cash-only, so a Payout Queue that can never actually pay
// anyone is noise on the finance page. `payoutsEnabled` on the finance summary (sourced
// server-side from arePayoutsEnabled()) is the single source of truth for whether to show it.

vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string, params?: Record<string, unknown>): string => {
    if (params) {
      const vals = Object.values(params).filter((v) => typeof v === 'string' || typeof v === 'number');
      if (vals.length > 0) return vals.map(String).join(' ');
    }
    return key.split('.').pop() ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: { role: 'super-admin' } }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: () => true,
}));

// The PnL chart is next/dynamic-loaded and irrelevant to this test's assertions.
vi.mock('@/components/finance/FinanceChart', () => ({
  default: () => null,
}));

const { fetchFinanceSummary, fetchPayoutQueue, approveAllPayouts } = vi.hoisted(() => ({
  fetchFinanceSummary: vi.fn(),
  fetchPayoutQueue: vi.fn(),
  approveAllPayouts: vi.fn(),
}));
vi.mock('@/api/finance', () => ({
  fetchFinanceSummary,
  fetchPayoutQueue,
  approveAllPayouts,
}));

function summary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return { dailyPnL: [], totalGross: 0, totalCommission: 0, totalNet: 0, ...overrides };
}

const queue: PayoutQueue = {
  weekStart: '2026-09-01',
  weekEnd: '2026-09-07',
  entries: [],
  totalNetPayable: 0,
};

describe('FinanceClient — Payout Queue visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPayoutQueue.mockResolvedValue(queue);
  });

  it('shows the Payout Queue when payoutsEnabled is true', async () => {
    fetchFinanceSummary.mockResolvedValue(summary({ payoutsEnabled: true }));
    render(<FinanceClient />);
    await waitFor(() => expect(screen.getByText('Payout Queue')).toBeDefined());
  });

  it('shows the Payout Queue when payoutsEnabled is absent (fail safe, not fail hidden)', async () => {
    fetchFinanceSummary.mockResolvedValue(summary());
    render(<FinanceClient />);
    await waitFor(() => expect(screen.getByText('Payout Queue')).toBeDefined());
  });

  it('hides the Payout Queue when the finance summary reports payoutsEnabled: false', async () => {
    fetchFinanceSummary.mockResolvedValue(summary({ payoutsEnabled: false }));
    render(<FinanceClient />);
    await waitFor(() => expect(fetchFinanceSummary).toHaveBeenCalled());
    expect(screen.queryByText('Payout Queue')).toBeNull();
  });

  it('does not flash the queue when the queue request resolves before the summary request', async () => {
    // The bug: `summary?.payoutsEnabled !== false` reads `summary === null` (still loading) as
    // permitted, so if `loadQueue` (which runs unconditionally, in parallel with `loadSummary`)
    // resolves first, the queue — and its approve controls — briefly renders in a cash-only pilot
    // before `payoutsEnabled: false` arrives and hides it. Hold the summary request open past the
    // point where the queue request has resolved, and assert the queue never renders meanwhile.
    let resolveSummary!: (value: FinanceSummary) => void;
    fetchFinanceSummary.mockReturnValue(
      new Promise<FinanceSummary>((resolve) => {
        resolveSummary = resolve;
      }),
    );
    fetchPayoutQueue.mockResolvedValue(queue);

    render(<FinanceClient />);

    // Let the queue request resolve fully while the summary request is still pending. (The
    // `next-intl` mock above renders a bare key's last segment, so `t('loading.queue')` -> 'queue'.)
    await waitFor(() => expect(screen.queryByText('queue')).toBeNull());
    expect(screen.queryByText('Payout Queue')).toBeNull();

    // Now resolve the summary as payouts-disabled — the queue must still never have appeared.
    resolveSummary(summary({ payoutsEnabled: false }));
    await waitFor(() => expect(screen.queryByText('summary')).toBeNull());
    expect(screen.queryByText('Payout Queue')).toBeNull();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock next-intl to return sentinel values proving t() is called
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/hi/finance',
}));

// Mock API calls — return empty state so component renders synchronously without network
vi.mock('@/api/finance', () => ({
  fetchFinanceSummary: vi.fn().mockResolvedValue({
    dailyPnL: [],
    totalGross: 0,
    totalCommission: 0,
    totalNet: 0,
  }),
  fetchPayoutQueue: vi.fn().mockResolvedValue({
    weekStart: '2026-05-01',
    weekEnd: '2026-05-07',
    entries: [],
    totalNetPayable: 0,
  }),
  approveAllPayouts: vi.fn(),
  formatPaise: (paise: number) => `₹${(paise / 100).toFixed(2)}`,
}));

// Mock auth
vi.mock('@/lib/auth/context', () => ({
  useAdminAuth: () => ({ auth: { role: 'super-admin' } }),
}));
vi.mock('@/admin/capabilities', () => ({
  hasCapability: () => true,
}));

// Mock recharts (server-side incompatible canvas APIs)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: () => null,
  Line: () => null,
}));

import { FinanceClient } from '../../src/components/finance/FinanceClient';

describe('Finance i18n extraction', () => {
  it('renders no hardcoded English "Finance" title', () => {
    render(React.createElement(FinanceClient));
    expect(screen.queryByText('Finance')).toBeNull();
  });

  it('renders i18n sentinel for title', () => {
    render(React.createElement(FinanceClient));
    expect(screen.getByText('[finance.title]')).toBeTruthy();
  });

  it('renders i18n sentinel for subtitle', () => {
    render(React.createElement(FinanceClient));
    expect(screen.getByText('[finance.subtitle]')).toBeTruthy();
  });

  it('renders i18n sentinels for date range labels', () => {
    render(React.createElement(FinanceClient));
    // The labels are rendered as children of <label> elements
    const fromLabel = screen.getByText('[finance.dateRange.from]');
    const toLabel = screen.getByText('[finance.dateRange.to]');
    expect(fromLabel).toBeTruthy();
    expect(toLabel).toBeTruthy();
  });
});

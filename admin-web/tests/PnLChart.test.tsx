import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PnLChart } from '../src/components/finance/PnLChart';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  // Bar must render its children (Cell overrides) — real recharts paints one rectangle per
  // data entry, using a child Cell's fill when present instead of the series-level fill.
  Bar: ({ dataKey, children }: { dataKey: string; children?: React.ReactNode }) => (
    <div data-testid={`bar-${dataKey}`}>{children}</div>
  ),
  Cell: ({ fill }: { fill?: string }) => <div data-testid="cell" data-fill={fill} />,
  XAxis: () => <div />,
  YAxis: ({ tickFormatter }: { tickFormatter?: (value: unknown) => string }) => (
    <div data-testid="y-axis-tick">{tickFormatter?.(59900)}</div>
  ),
  Tooltip: ({ formatter }: { formatter?: (value: unknown) => string }) => (
    <div data-testid="tooltip">{formatter?.(150000)}</div>
  ),
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
}));

const sampleData = [
  { date: '2026-04-14', grossRevenue: 150000, commission: 33750, netToOwner: 116250 },
  { date: '2026-04-15', grossRevenue: 90000, commission: 20250, netToOwner: 69750 },
];

const mixedSignData = [
  { date: '2026-04-14', grossRevenue: 150000, commission: 33750, netToOwner: 116250 },
  // Incentive-only day (E23-S01): no completed bookings, incentive cost still applied.
  { date: '2026-04-15', grossRevenue: 0, commission: 0, netToOwner: -50000 },
  { date: '2026-04-16', grossRevenue: 0, commission: 0, netToOwner: 0 },
];

describe('PnLChart', () => {
  it('renders a bar-chart container', () => {
    render(<PnLChart data={sampleData} locale="en" />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders three Bar series: grossRevenue, commission, netToOwner', () => {
    render(<PnLChart data={sampleData} locale="en" />);
    expect(screen.getByTestId('bar-grossRevenue')).toBeInTheDocument();
    expect(screen.getByTestId('bar-commission')).toBeInTheDocument();
    expect(screen.getByTestId('bar-netToOwner')).toBeInTheDocument();
  });

  it('renders without error when data is empty', () => {
    render(<PnLChart data={[]} locale="hi" />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('formats Y-axis ticks via the canonical formatter, whole-rupee (0 decimals), with the ₹ symbol', () => {
    render(<PnLChart data={sampleData} locale="en" />);
    // 59900 paise -> ₹599, no decimals (chart-tick override), still routed through formatINR.
    expect(screen.getByTestId('y-axis-tick').textContent).toBe('₹599');
  });

  it('formats the tooltip via the canonical formatter with the same whole-rupee override', () => {
    render(<PnLChart data={sampleData} locale="en" />);
    // 150000 paise -> ₹1,500, no decimals.
    expect(screen.getByTestId('tooltip').textContent).toBe('₹1,500');
  });

  // Issue #340: netToOwner was hard-coded to var(--color-success) regardless of sign. A genuine
  // loss day (E23-S01 incentive-only day: no bookings, incentive cost still applied) rendered
  // identically to a profit day. Colour must key off each day's own sign, not a fixed constant.
  it('colours each netToOwner bar by that day\'s own sign, not a fixed constant', () => {
    render(<PnLChart data={mixedSignData} locale="en" />);
    const netBar = screen.getByTestId('bar-netToOwner');
    const fills = Array.from(netBar.querySelectorAll('[data-testid="cell"]')).map((el) =>
      el.getAttribute('data-fill'),
    );
    // Day 1: +116250 -> success. Day 2: -50000 -> danger. Day 3: 0 -> non-negative -> success.
    expect(fills).toEqual([
      'var(--color-success)',
      'var(--color-danger)',
      'var(--color-success)',
    ]);
  });
});

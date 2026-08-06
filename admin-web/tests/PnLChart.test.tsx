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
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
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
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PnLChart } from '../src/components/finance/PnLChart';

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
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
    render(<PnLChart data={sampleData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders three Bar series: grossRevenue, commission, netToOwner', () => {
    render(<PnLChart data={sampleData} />);
    expect(screen.getByTestId('bar-grossRevenue')).toBeInTheDocument();
    expect(screen.getByTestId('bar-commission')).toBeInTheDocument();
    expect(screen.getByTestId('bar-netToOwner')).toBeInTheDocument();
  });

  it('renders without error when data is empty', () => {
    render(<PnLChart data={[]} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyPnLEntry } from '@/api/finance';

interface Props {
  data: DailyPnLEntry[];
}

function tickFormatter(value: unknown): string {
  if (typeof value !== 'number') return '';
  return `₹${(value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function PnLChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={tickFormatter} tick={{ fontSize: 12 }} />
        <Tooltip formatter={tickFormatter} />
        <Legend />
        <Bar dataKey="grossRevenue" name="Gross Revenue" fill="var(--color-brand)" />
        <Bar dataKey="commission" name="Commission" fill="var(--color-warn)" />
        <Bar dataKey="netToOwner" name="Net to Owner" fill="var(--color-success)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

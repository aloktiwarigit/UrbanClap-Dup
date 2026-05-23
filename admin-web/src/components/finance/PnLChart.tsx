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
import { useTranslations } from 'next-intl';
import type { DailyPnLEntry } from '@/api/finance';

interface Props {
  data: DailyPnLEntry[];
  locale: string;
}

export function PnLChart({ data, locale }: Props) {
  const t = useTranslations('finance');
  const localeStr = locale === 'hi' ? 'hi-IN' : 'en-IN';

  function tickFormatter(value: unknown): string {
    if (typeof value !== 'number') return '';
    return `₹${(value / 100).toLocaleString(localeStr, { maximumFractionDigits: 0 })}`;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={tickFormatter} tick={{ fontSize: 12 }} />
        <Tooltip formatter={tickFormatter} />
        <Legend />
        <Bar dataKey="grossRevenue" name={t('chart.legend.grossRevenue')} fill="var(--color-brand)" />
        <Bar dataKey="commission" name={t('chart.legend.commission')} fill="var(--color-warn)" />
        <Bar dataKey="netToOwner" name={t('chart.legend.netToOwner')} fill="var(--color-success)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

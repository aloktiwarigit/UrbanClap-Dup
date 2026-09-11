'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslations } from 'next-intl';
import { formatINR } from '@/lib/format/intl';
import type { DailyPnLEntry } from '@/api/finance';

interface Props {
  data: DailyPnLEntry[];
  locale: string;
}

export function PnLChart({ data, locale }: Props) {
  const t = useTranslations('finance');

  function tickFormatter(value: unknown): string {
    if (typeof value !== 'number') return '';
    // Chart ticks/tooltips stay whole-rupee (no decimals) for axis readability —
    // same canonical formatter as every other money site, just with a
    // fraction-digit override.
    return formatINR(value, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
        {/* Issue #340: netToOwner can go negative (E23-S01 — an incentive-only day with no
            completed bookings). A single series-level fill can't reflect that; colour each
            day's own bar by its own sign via a Cell override instead of a fixed constant. */}
        <Bar dataKey="netToOwner" name={t('chart.legend.netToOwner')}>
          {data.map((entry) => (
            <Cell
              key={entry.date}
              fill={entry.netToOwner >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

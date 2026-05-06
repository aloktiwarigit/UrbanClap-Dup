'use client';

import { useTranslations } from 'next-intl';
import { StatusFilterMenu } from './StatusFilterMenu';

export interface FiltersState {
  status: string; city: string; categoryId: string; technicianId: string;
  dateFrom: string; dateTo: string; minAmount: string; maxAmount: string;
  customerPhone: string; page: number;
}

const ALL_STATUSES = [
  'PENDING_PAYMENT',
  'SEARCHING',
  'ASSIGNED',
  'EN_ROUTE',
  'REACHED',
  'IN_PROGRESS',
  'AWAITING_PRICE_APPROVAL',
  'COMPLETED',
  'PAID',
  'CLOSED',
  'UNFULFILLED',
  'CUSTOMER_CANCELLED',
  'NO_SHOW_REDISPATCH',
  'CANCELLED',
] as const;

interface OrderFiltersProps { filters: FiltersState; onChange: (f: FiltersState) => void; }

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
  const t = useTranslations('orders');
  const selected = filters.status ? filters.status.split(',').filter(Boolean) : [];
  const update = (patch: Partial<FiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[var(--color-text-muted)] font-medium">{t('filters.status.label')}</span>
        <StatusFilterMenu
          statuses={ALL_STATUSES}
          selected={selected}
          onChange={(next) => update({ status: next.join(',') })}
        />
      </div>
      <input placeholder={t('filters.city.placeholder')} value={filters.city} onChange={e => update({ city: e.target.value })} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" />
      <input placeholder={t('filters.phone.placeholder')} value={filters.customerPhone} onChange={e => update({ customerPhone: e.target.value })} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" />
      <input placeholder={t('filters.technicianId.placeholder')} value={filters.technicianId} onChange={e => update({ technicianId: e.target.value })} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" />
      <input type="date" value={filters.dateFrom} onChange={e => update({ dateFrom: e.target.value })} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" aria-label="Date from" />
      <input type="date" value={filters.dateTo} onChange={e => update({ dateTo: e.target.value })} className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" aria-label="Date to" />
      <input placeholder={t('filters.minAmount.placeholder')} type="number" value={filters.minAmount} onChange={e => update({ minAmount: e.target.value })} className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" />
      <input placeholder={t('filters.maxAmount.placeholder')} type="number" value={filters.maxAmount} onChange={e => update({ maxAmount: e.target.value })} className="w-24 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]" />
    </div>
  );
}

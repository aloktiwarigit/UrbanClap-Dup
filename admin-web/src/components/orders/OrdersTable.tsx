'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDateTime } from '@/lib/format/intl';
import type { Order } from '@/types/order';
import { StatusBadge } from './StatusBadge';

interface OrdersTableProps {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  onRowClick: (o: Order) => void;
  onPageChange: (p: number) => void;
}

export function OrdersTable({ orders, total, page, pageSize, totalPages, isLoading, onRowClick, onPageChange }: OrdersTableProps) {
  void pageSize;
  void isLoading;
  const t = useTranslations('orders');
  const locale = useLocale();
  const columns = [
    t('table.columns.orderId'),
    t('table.columns.customer'),
    t('table.columns.service'),
    t('table.columns.technician'),
    t('table.columns.status'),
    t('table.columns.city'),
    t('table.columns.scheduled'),
    t('table.columns.amount'),
    t('table.columns.action'),
  ];
  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded border border-[var(--color-border)]">
        <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface-alt)]">
            <tr>
              {columns.map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {orders.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--color-text-faint)]">{t('table.emptyState')}</td></tr>
            ) : orders.map(order => (
              <tr
                key={order.id}
                onClick={() => onRowClick(order)}
                className="cursor-pointer hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]"
              >
                <td className="px-4 py-3 font-mono">{order.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">{order.serviceName ?? '—'}</td>
                <td className="px-4 py-3">{order.technicianName ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3">{order.city}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(order.scheduledAt, locale)}</td>
                <td className="px-4 py-3 font-medium">{formatINR(order.amount, locale)}</td>
                <td className="px-4 py-3 text-[var(--marigold)]">{t('table.viewAction')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-[var(--color-text-muted)]">
        <span>{total} total · page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)]">{t('table.pagination.prev')}</button>
          <button aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-40 hover:bg-[var(--color-surface-alt)]">{t('table.pagination.next')}</button>
        </div>
      </div>
    </div>
  );
}

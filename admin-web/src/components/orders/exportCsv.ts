import { paiseToRupeeNumber } from '@/lib/format/intl';
import type { Order } from '@/types/order';

/**
 * Both phone columns carry the masked values the API returned (ADR 0034).
 * The export never calls the reveal endpoint: a CSV is an uncontrolled copy —
 * it gets emailed, put on a shared drive, and kept indefinitely — so it must
 * never carry a value that only belongs to one admin looking at one order.
 * A reveal has to stay attributable to that one admin; a CSV cannot honor
 * that, which is exactly why it only ever carries pre-masked values.
 */

function escape(val: string | number | null | undefined): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildOrdersCsv(orders: Order[], t: (key: string) => string): string {
  const headers = [
    t('orderId'),
    t('customerName'),
    t('customerPhone'),
    t('serviceName'),
    t('technicianName'),
    t('technicianPhone'),
    t('status'),
    t('city'),
    t('scheduledAt'),
    t('amount'),
    t('createdAt'),
  ];
  const rows = [headers.join(',')];
  for (const o of orders) {
    rows.push([
      o.id, o.customerName, o.customerPhone,
      o.serviceName ?? '', o.technicianName ?? '', o.technicianPhoneMasked ?? '',
      o.status, o.city,
      o.scheduledAt, String(paiseToRupeeNumber(o.amount)), o.createdAt,
    ].map(escape).join(','));
  }
  return rows.join('\n');
}

export function exportOrdersCsv(orders: Order[], t: (key: string) => string): void {
  const csv = buildOrdersCsv(orders, t);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

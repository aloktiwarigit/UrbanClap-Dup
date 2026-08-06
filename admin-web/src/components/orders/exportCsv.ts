import { paiseToRupeeNumber } from '@/lib/format/intl';
import type { Order } from '@/types/order';

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
      o.serviceName ?? '', o.technicianName ?? '',
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

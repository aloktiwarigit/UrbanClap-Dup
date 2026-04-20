import type { Order } from '@/types/order';

const HEADERS = [
  'Order ID','Customer Name','Customer Phone','Service Name',
  'Technician Name','Status','City','Scheduled At','Amount (INR)','Created At',
];

function escape(val: string | number | null | undefined): string {
  const s = val == null ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildOrdersCsv(orders: Order[]): string {
  const rows = [HEADERS.join(',')];
  for (const o of orders) {
    rows.push([
      o.id, o.customerName, o.customerPhone,
      o.serviceName ?? '', o.technicianName ?? '',
      o.status, o.city,
      o.scheduledAt, String(o.amount / 100), o.createdAt,
    ].map(escape).join(','));
  }
  return rows.join('\n');
}

export function exportOrdersCsv(orders: Order[]): void {
  const csv = buildOrdersCsv(orders);
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

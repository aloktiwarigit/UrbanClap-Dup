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

function formatAmount(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}

export function OrdersTable({ orders, total, page, pageSize, totalPages, isLoading, onRowClick, onPageChange }: OrdersTableProps) {
  void pageSize;
  void isLoading;
  return (
    <div className="mt-4">
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Order ID','Customer','Service','Technician','Status','City','Scheduled','Amount','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orders.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} onClick={() => onRowClick(order)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{order.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">{order.serviceName ?? '—'}</td>
                <td className="px-4 py-3">{order.technicianName ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3">{order.city}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatScheduled(order.scheduledAt)}</td>
                <td className="px-4 py-3 font-medium">{formatAmount(order.amount)}</td>
                <td className="px-4 py-3 text-blue-600">View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <span>{total} total · page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Prev</button>
          <button aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>
  );
}

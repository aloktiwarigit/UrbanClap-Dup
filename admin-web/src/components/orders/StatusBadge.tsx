import type { OrderStatus } from '@/types/order';

const STATUS_STYLES: Record<OrderStatus, string> = {
  SEARCHING:   'bg-yellow-100 text-yellow-800',
  ASSIGNED:    'bg-blue-100 text-blue-800',
  EN_ROUTE:    'bg-indigo-100 text-indigo-800',
  REACHED:     'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED:   'bg-green-100 text-green-800',
  CANCELLED:   'bg-red-100 text-red-800',
  PAID:        'bg-emerald-100 text-emerald-800',
};

interface StatusBadgeProps { status: OrderStatus; }

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

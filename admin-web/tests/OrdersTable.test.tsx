import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrdersTable } from '../src/components/orders/OrdersTable';
import type { Order } from '../src/types/order';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'table.columns.orderId': 'Order ID',
      'table.columns.customer': 'Customer',
      'table.columns.service': 'Service',
      'table.columns.technician': 'Technician',
      'table.columns.status': 'Status',
      'table.columns.city': 'City',
      'table.columns.scheduled': 'Scheduled',
      'table.columns.amount': 'Amount',
      'table.columns.action': 'Action',
      'table.emptyState': 'No orders found',
      'table.viewAction': 'View →',
      'table.pagination.prev': 'Prev',
      'table.pagination.next': 'Next',
      // StatusBadge statuses — ASSIGNED not in catalog, fallback used
      'statuses.COMPLETED': 'Completed',
    };
    return map[key] ?? key;
  },
}));

const sampleOrder: Order = {
  id: 'ord_12345678', customerId: 'cust_1', customerName: 'Rahul Sharma',
  customerPhone: '9999999999', status: 'ASSIGNED', city: 'Bengaluru',
  scheduledAt: new Date().toISOString(), amount: 599, createdAt: new Date().toISOString(),
};

describe('OrdersTable', () => {
  const baseProps = {
    orders: [sampleOrder], total: 1, page: 1, pageSize: 50,
    totalPages: 1, isLoading: false,
    onRowClick: vi.fn(), onPageChange: vi.fn(),
  };

  it('renders customer name in a row', () => {
    render(<OrdersTable {...baseProps} />);
    expect(screen.getByText('Rahul Sharma')).toBeDefined();
  });

  it('renders StatusBadge with status text (fallback for unknown status)', () => {
    render(<OrdersTable {...baseProps} />);
    // ASSIGNED not in catalog → falls back to raw status string
    expect(screen.getByText('ASSIGNED')).toBeDefined();
  });

  it('calls onRowClick with order when row is clicked', () => {
    render(<OrdersTable {...baseProps} />);
    fireEvent.click(screen.getByText('Rahul Sharma'));
    expect(baseProps.onRowClick).toHaveBeenCalledWith(sampleOrder);
  });

  it('Prev button is disabled on page 1', () => {
    render(<OrdersTable {...baseProps} />);
    expect((screen.getByLabelText('Previous page') as HTMLButtonElement).disabled).toBe(true);
  });

  it('Next button is disabled when page equals totalPages', () => {
    render(<OrdersTable {...baseProps} page={1} totalPages={1} />);
    expect((screen.getByLabelText('Next page') as HTMLButtonElement).disabled).toBe(true);
  });
});

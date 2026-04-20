import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrdersTable } from '../src/components/orders/OrdersTable';
import type { Order } from '../src/types/order';

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

  it('renders StatusBadge with status text', () => {
    render(<OrdersTable {...baseProps} />);
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

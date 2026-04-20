import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSlideOver } from '../src/components/orders/OrderSlideOver';
import type { Order } from '../src/types/order';

const order: Order = {
  id: 'ord_12345678abcd', customerId: 'cust_1', customerName: 'Priya Kumari',
  customerPhone: '8888888888', technicianName: 'Rajesh Kumar',
  serviceId: 'svc_1', serviceName: 'AC Repair',
  technicianId: 'tech_1', status: 'COMPLETED', city: 'Mysuru',
  scheduledAt: new Date().toISOString(), amount: 79900, createdAt: new Date().toISOString(),
};

describe('OrderSlideOver', () => {
  it('renders customerName', () => {
    render(<OrderSlideOver order={order} onClose={vi.fn()} />);
    expect(screen.getByText('Priya Kumari')).toBeDefined();
  });

  it('renders technicianName', () => {
    render(<OrderSlideOver order={order} onClose={vi.fn()} />);
    expect(screen.getByText('Rajesh Kumar')).toBeDefined();
  });

  it('renders formatted amount', () => {
    render(<OrderSlideOver order={order} onClose={vi.fn()} />);
    expect(screen.getByText('₹799')).toBeDefined();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(<OrderSlideOver order={order} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close slide-over'));
    expect(onClose).toHaveBeenCalled();
  });
});

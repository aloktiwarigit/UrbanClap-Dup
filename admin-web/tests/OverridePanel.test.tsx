import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverridePanel } from '../src/components/orders/OverridePanel';
import type { Order } from '../src/types/order';

vi.mock('../src/api/orders', () => ({
  reassignOrder: vi.fn(),
  completeOrder: vi.fn(),
  refundOrder: vi.fn(),
  waiveFeeOrder: vi.fn(),
  escalateOrder: vi.fn(),
  addOrderNote: vi.fn(),
  fetchOrders: vi.fn(),
  fetchOrderById: vi.fn(),
  fetchAllOrdersForExport: vi.fn(),
}));

import { completeOrder } from '../src/api/orders';

const sampleOrder: Order = {
  id: 'ord_abc123',
  customerId: 'cust_1',
  customerName: 'Test User',
  customerPhone: '9999999999',
  technicianId: 'tech_1',
  status: 'ASSIGNED',
  city: 'Bengaluru',
  scheduledAt: new Date().toISOString(),
  amount: 500,
  createdAt: new Date().toISOString(),
};

const mockUpdatedOrder: Order = { ...sampleOrder, status: 'COMPLETED' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OverridePanel', () => {
  it('renders 6 action buttons', () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /re-assign tech/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /issue refund/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /waive fee/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /escalate/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /add note/i })).toBeDefined();
  });

  it('clicking Mark Complete opens modal', () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('clicking Cancel closes the modal', () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('submitting complete reason calls completeOrder', async () => {
    vi.mocked(completeOrder).mockResolvedValue(mockUpdatedOrder);
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    const textarea = screen.getByRole('textbox', { name: /reason/i });
    fireEvent.change(textarea, { target: { value: 'Job done well' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(completeOrder).toHaveBeenCalledWith('ord_abc123', { reason: 'Job done well' });
    });
  });

  it('onActionComplete is called after successful action', async () => {
    vi.mocked(completeOrder).mockResolvedValue(mockUpdatedOrder);
    const onActionComplete = vi.fn();
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={onActionComplete}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    const textarea = screen.getByRole('textbox', { name: /reason/i });
    fireEvent.change(textarea, { target: { value: 'Job done well' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledWith(mockUpdatedOrder);
    });
  });

  it('clicking Add Note opens modal with Note label', () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByLabelText('Note')).toBeDefined();
  });

  it('reassign modal shows extra input for Technician ID', () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /re-assign tech/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByLabelText('New Technician ID')).toBeDefined();
  });

  it('onError called when API throws', async () => {
    vi.mocked(completeOrder).mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={onError}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));
    const textarea = screen.getByRole('textbox', { name: /reason/i });
    fireEvent.change(textarea, { target: { value: 'Job done well' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Action failed. Please try again.');
    });
  });
});

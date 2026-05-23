import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverridePanel } from '../src/components/orders/OverridePanel';
import type { Order } from '../src/types/order';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      'detail.sections.actions.heading': 'Actions',
      'detail.sections.actions.noPermission': 'Your role can review this order but cannot run operational overrides.',
      'actions.reassign.title': 'Re-assign Technician',
      'actions.reassign.buttonLabel': 'Re-assign Tech',
      'actions.reassign.selectLabel': 'Technician',
      'actions.reassign.loadingPlaceholder': 'Loading technicians…',
      'actions.reassign.noEligibleTechs': 'No eligible technicians found for this service area.',
      'actions.reassign.fetchError': 'Could not load technicians for this area.',
      'actions.complete.title': 'Mark Order Complete',
      'actions.complete.buttonLabel': 'Mark Complete',
      'actions.refund.title': 'Issue Refund (stub)',
      'actions.refund.buttonLabel': 'Issue Refund',
      'actions.waiveFee.title': 'Waive Fee',
      'actions.waiveFee.buttonLabel': 'Waive Fee',
      'actions.escalate.title': params?.priority ? `Escalate (${params.priority as string})` : 'Escalate',
      'actions.escalate.buttonLabel': 'Escalate',
      'actions.escalate.priorityLabel': 'Escalate priority:',
      'actions.escalate.priorities.HIGH': 'HIGH',
      'actions.escalate.priorities.CRITICAL': 'CRITICAL',
      'actions.note.title': 'Add Internal Note',
      'actions.note.buttonLabel': 'Add Note',
      'actions.note.label': 'Note',
      'actions.error': 'Action failed. Please try again.',
      // ConfirmModal keys
      'confirmModal.reasonLabel': 'Reason',
      'confirmModal.selectPlaceholder': params?.label ? `Select ${params.label as string}` : 'Select',
      'confirmModal.minCharactersHint': params?.min ? `Min ${params.min as string} characters` : 'Min characters',
      'confirmModal.cancelButton': 'Cancel',
      'confirmModal.submitButton.label': 'Confirm',
      'confirmModal.submitButton.loading': 'Processing…',
    };
    return map[key] ?? key;
  },
}));

vi.mock('../src/api/orders', () => ({
  reassignOrder: vi.fn(),
  completeOrder: vi.fn(),
  refundOrder: vi.fn(),
  waiveFeeOrder: vi.fn(),
  escalateOrder: vi.fn(),
  addOrderNote: vi.fn(),
  fetchTechnicianCandidatesForOrder: vi.fn(),
  fetchOrders: vi.fn(),
  fetchOrderById: vi.fn(),
  fetchAllOrdersForExport: vi.fn(),
}));

import { completeOrder, fetchTechnicianCandidatesForOrder, reassignOrder } from '../src/api/orders';

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
  vi.mocked(fetchTechnicianCandidatesForOrder).mockResolvedValue([
    {
      technicianId: 'tech_2',
      displayName: 'Ravi Kumar',
      distanceKm: 2.4,
      rating: 4.8,
      isOnline: true,
      isAvailable: true,
    },
  ]);
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

  it('reassign modal shows a technician dropdown', async () => {
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /re-assign tech/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByLabelText('Technician')).toBeDefined();
      expect(screen.getByRole('option', { name: /ravi kumar/i })).toBeDefined();
    });
  });

  it('submitting reassign uses selected technician id', async () => {
    vi.mocked(reassignOrder).mockResolvedValue({ ...sampleOrder, technicianId: 'tech_2' });
    render(
      <OverridePanel
        order={sampleOrder}
        onActionComplete={vi.fn()}
        onError={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /re-assign tech/i }));
    const select = await screen.findByLabelText('Technician');
    fireEvent.change(select, { target: { value: 'tech_2' } });
    fireEvent.change(screen.getByRole('textbox', { name: /reason/i }), {
      target: { value: 'Customer requested reassignment' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => {
      expect(reassignOrder).toHaveBeenCalledWith('ord_abc123', {
        technicianId: 'tech_2',
        reason: 'Customer requested reassignment',
      });
    });
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

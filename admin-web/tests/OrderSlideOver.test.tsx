import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderSlideOver } from '../src/components/orders/OrderSlideOver';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      'detail.title': params?.orderId ? `Order ${params.orderId as string}` : 'Order',
      'detail.closeButton.ariaLabel': 'Close slide-over',
      'detail.sections.status': 'Status',
      'detail.sections.customer': 'Customer',
      'detail.sections.technician': 'Technician',
      'detail.sections.service': 'Service',
      'detail.sections.location': 'Location',
      'detail.sections.scheduled': 'Scheduled',
      'detail.sections.payment': 'Payment',
      'detail.sections.created': 'Created',
      'detail.sections.evidencePhotos': 'Job Photos',
      'detail.sections.actions.heading': 'Actions',
      'detail.sections.actions.noPermission': 'Your role can review this order but cannot run operational overrides.',
      'detail.toast.success': 'Action completed successfully.',
      // OverridePanel keys
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
  fetchOrders: vi.fn(),
  fetchOrderById: vi.fn(),
  fetchAllOrdersForExport: vi.fn(),
  fetchTechnicianCandidatesForOrder: vi.fn().mockResolvedValue([]),
}));
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

  it('renders formatted amount via locale-aware formatINR', () => {
    render(<OrderSlideOver order={order} onClose={vi.fn()} />);
    // formatINR(79900, 'en') → "₹799.00" (Intl currency adds 2-decimal precision).
    expect(screen.getByText(/₹\s?799/)).toBeDefined();
  });

  it('renders evidence photo thumbnails when present', () => {
    render(
      <OrderSlideOver
        order={{
          ...order,
          jobPhotoSets: [{ stage: 'EN_ROUTE', urls: ['https://signed.example/photo.jpg'] }],
        }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Job Photos')).toBeDefined();
    expect(screen.getByAltText('Start trip evidence 1')).toBeDefined();
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(<OrderSlideOver order={order} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close slide-over'));
    expect(onClose).toHaveBeenCalled();
  });
});

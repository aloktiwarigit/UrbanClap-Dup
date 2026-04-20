import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComplaintSlideOver } from '../../../src/components/complaints/ComplaintSlideOver';
import type { Complaint } from '../../../src/types/complaint';

function makeComplaint(overrides?: Partial<Complaint>): Complaint {
  const base: Complaint = {
    id: 'comp_001',
    orderId: 'ord_abc123',
    customerId: 'cust_xyz789',
    technicianId: 'tech_001',
    description: 'Technician arrived 2 hours late and was rude',
    status: 'INVESTIGATING',
    assigneeAdminId: 'admin_007',
    internalNotes: [
      { adminId: 'admin_007', note: 'Contacted technician', createdAt: new Date().toISOString() },
    ],
    slaDeadlineAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

describe('ComplaintSlideOver', () => {
  it('renders complaint description', () => {
    render(
      <ComplaintSlideOver
        complaint={makeComplaint()}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onAddNote={vi.fn()}
        onResolve={vi.fn()}
        onReassign={vi.fn()}
      />,
    );
    expect(screen.getByText('Technician arrived 2 hours late and was rude')).toBeDefined();
  });

  it('renders assignee field', () => {
    render(
      <ComplaintSlideOver
        complaint={makeComplaint()}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onAddNote={vi.fn()}
        onResolve={vi.fn()}
        onReassign={vi.fn()}
      />,
    );
    // assigneeAdminId appears in the input and the label below it
    const elements = screen.getAllByText(/admin_007/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders existing internal notes', () => {
    render(
      <ComplaintSlideOver
        complaint={makeComplaint()}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onAddNote={vi.fn()}
        onResolve={vi.fn()}
        onReassign={vi.fn()}
      />,
    );
    expect(screen.getByText('Contacted technician')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ComplaintSlideOver
        complaint={makeComplaint()}
        onClose={onClose}
        onStatusChange={vi.fn()}
        onAddNote={vi.fn()}
        onResolve={vi.fn()}
        onReassign={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close slide-over'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onAddNote with note text when note form is submitted', () => {
    const onAddNote = vi.fn();
    render(
      <ComplaintSlideOver
        complaint={makeComplaint()}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onAddNote={onAddNote}
        onResolve={vi.fn()}
        onReassign={vi.fn()}
      />,
    );
    const textarea = screen.getByPlaceholderText(/internal note/i);
    fireEvent.change(textarea, { target: { value: 'Following up with customer' } });
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(onAddNote).toHaveBeenCalledWith('Following up with customer');
  });

  it('calls onResolve with resolution category when resolve button is clicked', () => {
    const onResolve = vi.fn();
    render(
      <ComplaintSlideOver
        complaint={makeComplaint({ status: 'INVESTIGATING' })}
        onClose={vi.fn()}
        onStatusChange={vi.fn()}
        onAddNote={vi.fn()}
        onResolve={onResolve}
        onReassign={vi.fn()}
      />,
    );
    const select = screen.getByLabelText(/resolution category/i);
    fireEvent.change(select, { target: { value: 'SERVICE_QUALITY' } });
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));
    expect(onResolve).toHaveBeenCalledWith('SERVICE_QUALITY');
  });
});

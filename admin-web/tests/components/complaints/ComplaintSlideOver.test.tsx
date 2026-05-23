import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string, params?: Record<string, unknown>): string => {
    if (params) {
      if ('h' in params && 'm' in params) return `${String(params.h)}h ${String(params.m)}m`;
      if ('m' in params && !('h' in params)) return `${String(params.m)}m`;
      const vals = Object.values(params).filter(v => typeof v === 'string' || typeof v === 'number');
      if (vals.length === 1) return String(vals[0]);
      if (vals.length > 0) return vals.map(String).join(' ');
    }
    const last = key.split('.').pop() ?? key;
    return last.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  },
  useLocale: () => 'en',
}));

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
    // aria-label is t('detail.closeButton.ariaLabel') → mock returns "aria label"
    fireEvent.click(screen.getByLabelText(/aria label/i));
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
    // Both assignee input and note textarea use t(…placeholder) → mock returns "placeholder".
    // Select the textarea specifically by filtering on element tag.
    const allPlaceholders = screen.getAllByPlaceholderText(/placeholder/i);
    const textarea = allPlaceholders.find(el => el.tagName === 'TEXTAREA')!;
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

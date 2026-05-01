import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComplaintCard } from '../../../src/components/complaints/ComplaintCard';
import type { Complaint } from '../../../src/types/complaint';

function makeComplaint(overrides?: Partial<Complaint>): Complaint {
  const future = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5h from now
  const base: Complaint = {
    id: 'comp_001',
    orderId: 'ord_abc123',
    customerId: 'cust_xyz789',
    technicianId: 'tech_001',
    description: 'Technician arrived 2 hours late',
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: future,
    escalated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

describe('ComplaintCard', () => {
  it('renders customer ID (short)', () => {
    render(<ComplaintCard complaint={makeComplaint()} onClick={vi.fn()} />);
    expect(screen.getByText(/cust_xyz/)).toBeDefined();
  });

  it('renders order ID (short)', () => {
    render(<ComplaintCard complaint={makeComplaint()} onClick={vi.fn()} />);
    expect(screen.getByText(/ord_abc/)).toBeDefined();
  });

  it('shows SLA countdown text', () => {
    render(<ComplaintCard complaint={makeComplaint()} onClick={vi.fn()} />);
    // Should display something like "4h 59m" or similar
    expect(screen.getByText(/\d+h/)).toBeDefined();
  });

  it('shows SLA badge as urgent when less than 2 hours remain', () => {
    const soonDeadline = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min from now
    render(<ComplaintCard complaint={makeComplaint({ slaDeadlineAt: soonDeadline })} onClick={vi.fn()} />);
    const slaEl = screen.getByText(/\d+m/);
    expect(slaEl).toHaveAttribute('data-urgent', '');
  });

  it('shows SLA badge as non-urgent when more than 2 hours remain', () => {
    const farDeadline = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5h from now
    render(<ComplaintCard complaint={makeComplaint({ slaDeadlineAt: farDeadline })} onClick={vi.fn()} />);
    const slaEl = screen.getByText(/\d+h/);
    expect(slaEl).not.toHaveAttribute('data-urgent');
  });

  it('calls onClick when the card is clicked', () => {
    const onClick = vi.fn();
    render(<ComplaintCard complaint={makeComplaint()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

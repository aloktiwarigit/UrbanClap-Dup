import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PayoutQueueTable } from '../src/components/finance/PayoutQueueTable';
import type { PayoutQueueEntry } from '../src/api/finance';

const entries: PayoutQueueEntry[] = [
  {
    technicianId: 't1',
    technicianName: 'Ravi Kumar',
    completedJobsThisWeek: 5,
    grossEarnings: 250000,
    commissionDeducted: 56250,
    netPayable: 193750,
  },
  {
    technicianId: 't2',
    technicianName: 'Suresh Babu',
    completedJobsThisWeek: 3,
    grossEarnings: 120000,
    commissionDeducted: 27000,
    netPayable: 93000,
  },
];

describe('PayoutQueueTable', () => {
  it('renders a row per technician', () => {
    render(<PayoutQueueTable entries={entries} totalNetPayable={286750} onApproveAll={vi.fn()} />);
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Suresh Babu')).toBeInTheDocument();
  });

  it('shows empty-state message when entries array is empty', () => {
    render(<PayoutQueueTable entries={[]} totalNetPayable={0} onApproveAll={vi.fn()} />);
    expect(screen.getByText(/no payouts/i)).toBeInTheDocument();
  });

  it('calls onApproveAll when the "Approve All" button is clicked', () => {
    const onApproveAll = vi.fn();
    render(<PayoutQueueTable entries={entries} totalNetPayable={286750} onApproveAll={onApproveAll} />);
    fireEvent.click(screen.getByRole('button', { name: /approve all/i }));
    expect(onApproveAll).toHaveBeenCalledOnce();
  });

  it('disables the "Approve All" button when entries are empty', () => {
    render(<PayoutQueueTable entries={[]} totalNetPayable={0} onApproveAll={vi.fn()} />);
    expect(screen.getByRole('button', { name: /approve all/i })).toBeDisabled();
  });

  it('formats netPayable as paise / 100 with ₹ prefix', () => {
    render(<PayoutQueueTable entries={entries} totalNetPayable={286750} onApproveAll={vi.fn()} />);
    // 193750 paise = ₹1,937.50
    expect(screen.getByText(/₹1,937\.50/)).toBeInTheDocument();
  });
});

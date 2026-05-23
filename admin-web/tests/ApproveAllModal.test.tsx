import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

import { ApproveAllModal } from '../src/components/finance/ApproveAllModal';

describe('ApproveAllModal', () => {
  it('shows the formatted total amount', () => {
    render(<ApproveAllModal totalNetPayable={286750} onConfirm={vi.fn()} onCancel={vi.fn()} loading={false} />);
    // 286750 paise = ₹2,867.50
    expect(screen.getByText(/₹2,867\.50/)).toBeInTheDocument();
  });

  it('has role="dialog" for accessibility', () => {
    render(<ApproveAllModal totalNetPayable={1000} onConfirm={vi.fn()} onCancel={vi.fn()} loading={false} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ApproveAllModal totalNetPayable={1000} onConfirm={onConfirm} onCancel={vi.fn()} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ApproveAllModal totalNetPayable={1000} onConfirm={vi.fn()} onCancel={onCancel} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('disables Confirm button and shows "Processing…" when loading', () => {
    render(<ApproveAllModal totalNetPayable={1000} onConfirm={vi.fn()} onCancel={vi.fn()} loading={true} />);
    const confirmBtn = screen.getByRole('button', { name: /processing/i });
    expect(confirmBtn).toBeDisabled();
  });
});

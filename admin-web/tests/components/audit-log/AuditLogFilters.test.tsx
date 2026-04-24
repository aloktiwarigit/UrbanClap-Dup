import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogFilters } from '@/components/audit-log/AuditLogFilters';
import { EMPTY_FILTERS } from '@/types/audit-log';
import type { AuditLogFiltersState } from '@/types/audit-log';

describe('AuditLogFilters', () => {
  it('renders all filter inputs', () => {
    const onChange = vi.fn();
    render(<AuditLogFilters filters={EMPTY_FILTERS} onChange={onChange} />);
    expect(screen.getByLabelText(/admin id/i)).toBeDefined();
    expect(screen.getByLabelText(/action/i)).toBeDefined();
    expect(screen.getByLabelText(/resource type/i)).toBeDefined();
    expect(screen.getByLabelText(/resource id/i)).toBeDefined();
    expect(screen.getByLabelText(/from/i)).toBeDefined();
    expect(screen.getByLabelText(/to/i)).toBeDefined();
  });

  it('calls onChange with updated adminId when input changes', () => {
    const onChange = vi.fn();
    render(<AuditLogFilters filters={EMPTY_FILTERS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/admin id/i), { target: { value: 'admin-99' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<AuditLogFiltersState>>({ adminId: 'admin-99' }),
    );
  });

  it('calls onChange with updated action when input changes', () => {
    const onChange = vi.fn();
    render(<AuditLogFilters filters={EMPTY_FILTERS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/action/i), {
      target: { value: 'admin.login' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<AuditLogFiltersState>>({ action: 'admin.login' }),
    );
  });

  it('renders a clear/reset button', () => {
    const onChange = vi.fn();
    render(<AuditLogFilters filters={EMPTY_FILTERS} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeDefined();
  });

  it('calls onChange with empty filters when Clear is clicked', () => {
    const onChange = vi.fn();
    const filledFilters: AuditLogFiltersState = {
      ...EMPTY_FILTERS,
      adminId: 'admin-1',
      action: 'admin.login',
    };
    render(<AuditLogFilters filters={filledFilters} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });
});

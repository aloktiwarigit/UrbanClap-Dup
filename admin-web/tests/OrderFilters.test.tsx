import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderFilters, type FiltersState } from '../src/components/orders/OrderFilters';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'filters.status.label': 'Status',
      'filters.city.placeholder': 'City',
      'filters.phone.placeholder': 'Phone',
      'filters.technicianId.placeholder': 'Technician ID',
      'filters.minAmount.placeholder': 'Min ₹',
      'filters.maxAmount.placeholder': 'Max ₹',
    };
    return map[key] ?? key;
  },
}));

const defaultFilters: FiltersState = {
  status: '', city: '', categoryId: '', technicianId: '',
  dateFrom: '', dateTo: '', minAmount: '', maxAmount: '',
  customerPhone: '', page: 1,
};

describe('OrderFilters', () => {
  it('renders status select', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByRole('listbox', { name: /status/i })).toBeDefined();
  });

  it('includes every backend booking status operators need to filter', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'PENDING_PAYMENT' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'AWAITING_PRICE_APPROVAL' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'CUSTOMER_CANCELLED' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'NO_SHOW_REDISPATCH' })).toBeDefined();
  });

  it('renders city input', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('City')).toBeDefined();
  });

  it('renders phone input', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Phone')).toBeDefined();
  });

  it('calls onChange with updated city when city input changes', () => {
    const onChange = vi.fn();
    render(<OrderFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Bengaluru' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ city: 'Bengaluru' }));
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderFilters, type FiltersState } from '../src/components/orders/OrderFilters';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'buttonNSelected' && params?.count !== undefined) {
      return `${params.count} selected`;
    }
    const map: Record<string, string> = {
      'filters.status.label': 'Status',
      'filters.status.buttonNoneSelected': 'No status filter',
      'filters.status.buttonAllSelected': 'All statuses',
      'filters.status.applyButton': 'Apply',
      'filters.status.clearButton': 'Clear all',
      'filters.status.menuLabel': 'Filter by status',
      'filters.city.placeholder': 'City',
      'filters.phone.placeholder': 'Phone',
      'filters.technicianId.placeholder': 'Technician ID',
      'filters.minAmount.placeholder': 'Min ₹',
      'filters.maxAmount.placeholder': 'Max ₹',
      // StatusFilterMenu reads from a deeper namespace; map both forms
      buttonNoneSelected: 'No status filter',
      buttonAllSelected: 'All statuses',
      applyButton: 'Apply',
      clearButton: 'Clear all',
      menuLabel: 'Filter by status',
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
  it('renders the status menu trigger with "No status filter" when empty', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /no status filter/i })).toBeDefined();
  });

  it('exposes every backend booking status via the checklist menu', () => {
    render(<OrderFilters filters={defaultFilters} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /no status filter/i }));
    expect(screen.getByRole('checkbox', { name: 'PENDING_PAYMENT' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'AWAITING_PRICE_APPROVAL' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'CUSTOMER_CANCELLED' })).toBeDefined();
    expect(screen.getByRole('checkbox', { name: 'NO_SHOW_REDISPATCH' })).toBeDefined();
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

  it('calls onChange with comma-joined statuses when the menu is applied', () => {
    const onChange = vi.fn();
    render(<OrderFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /no status filter/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'ASSIGNED' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'EN_ROUTE' }));
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ASSIGNED,EN_ROUTE' }),
    );
  });
});

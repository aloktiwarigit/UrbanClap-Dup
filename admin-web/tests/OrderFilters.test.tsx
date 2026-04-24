import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderFilters, type FiltersState } from '../src/components/orders/OrderFilters';

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

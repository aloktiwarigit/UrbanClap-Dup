import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

import { CustomerCell } from '../../../src/components/orders/CustomerCell';

describe('CustomerCell', () => {
  it('renders the customer name when present', () => {
    render(<CustomerCell orderId="ord_1" name="Priya Kumari" phone="9999999999" canReveal={false} />);
    expect(screen.getByText('Priya Kumari')).toBeDefined();
    expect(screen.getByText('9999999999')).toBeDefined();
  });

  it('falls back to translated "No name" when name is empty', () => {
    render(<CustomerCell orderId="ord_1" name="" phone="8888888888" canReveal={false} />);
    expect(screen.getByText('[orders.cells.customer.noName]')).toBeDefined();
    expect(screen.getByText('8888888888')).toBeDefined();
  });

  it('falls back to translated "No name" when name is whitespace', () => {
    render(<CustomerCell orderId="ord_1" name="   " phone="7777777777" canReveal={false} />);
    expect(screen.getByText('[orders.cells.customer.noName]')).toBeDefined();
  });

  it('renders phone alone if name is missing AND no phone fallback needed', () => {
    render(<CustomerCell orderId="ord_1" name="" phone="6666666666" canReveal={false} />);
    // Phone stays prominent so operators can still call back even without a name
    expect(screen.getByText('6666666666')).toBeDefined();
  });
});

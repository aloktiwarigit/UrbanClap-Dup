import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
}));

import { TechnicianCell } from '../../../src/components/orders/TechnicianCell';

describe('TechnicianCell', () => {
  it('renders technician name when assigned', () => {
    render(<TechnicianCell name="Rajesh Kumar" id="tech_abc123" />);
    expect(screen.getByText('Rajesh Kumar')).toBeDefined();
    // Short ID hint helps operators correlate with FCM logs
    expect(screen.getByText(/tech_abc/)).toBeDefined();
  });

  it('renders translated "Unassigned" when technicianId is missing', () => {
    render(<TechnicianCell />);
    expect(screen.getByText('[orders.cells.technician.unassigned]')).toBeDefined();
  });

  it('renders technician id with no name', () => {
    render(<TechnicianCell id="tech_xyz789" />);
    expect(screen.getByText(/tech_xyz/)).toBeDefined();
  });
});

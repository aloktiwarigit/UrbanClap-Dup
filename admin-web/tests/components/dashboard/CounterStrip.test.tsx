import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CounterStrip } from '../../../src/components/dashboard/CounterStrip';
import type { components } from '../../../src/api/generated/schema';

type DashboardSummary = components['schemas']['DashboardSummary'];

const baseSummary: DashboardSummary = {
  bookingsToday: 42,
  gmvToday: 150000, // paise → ₹1,500
  commissionToday: 18000, // paise → ₹180
  payoutsPending: 75000, // paise → ₹750
  complaintsOpen: 3,
  techsOnDuty: 12,
};

describe('CounterStrip', () => {
  it('renders all 6 KPI tiles', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByText('Bookings · Today')).toBeDefined();
    expect(screen.getByText('GMV · Today')).toBeDefined();
    expect(screen.getByText('Commission')).toBeDefined();
    expect(screen.getByText('Payouts · Pending')).toBeDefined();
    expect(screen.getByText('Complaints · Open')).toBeDefined();
    expect(screen.getByText('Techs · On duty')).toBeDefined();
  });

  it('renders raw count for bookingsToday', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-bookingsToday').textContent).toContain('42');
  });

  it('formats gmvToday paise value as ₹ string', () => {
    render(<CounterStrip summary={baseSummary} />);
    // 150000 paise → ₹1,500
    const tile = screen.getByTestId('tile-gmvToday');
    expect(tile.textContent).toContain('₹');
    expect(tile.textContent).toContain('1,500');
  });

  it('formats commissionToday paise value as ₹ string', () => {
    render(<CounterStrip summary={baseSummary} />);
    const tile = screen.getByTestId('tile-commissionToday');
    expect(tile.textContent).toContain('₹');
    expect(tile.textContent).toContain('180');
  });

  it('formats payoutsPending paise value as ₹ string', () => {
    render(<CounterStrip summary={baseSummary} />);
    const tile = screen.getByTestId('tile-payoutsPending');
    expect(tile.textContent).toContain('₹');
    expect(tile.textContent).toContain('750');
  });

  it('tile for bookingsToday has data-accent="teal"', () => {
    render(<CounterStrip summary={baseSummary} />);
    const tile = screen.getByTestId('tile-bookingsToday');
    expect(tile.getAttribute('data-accent')).toBe('teal');
  });

  it('tile for gmvToday has data-accent="teal"', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-gmvToday').getAttribute('data-accent')).toBe('teal');
  });

  it('tile for commissionToday has data-accent="ember"', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-commissionToday').getAttribute('data-accent')).toBe('ember');
  });

  it('tile for payoutsPending has data-accent="ember"', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-payoutsPending').getAttribute('data-accent')).toBe('ember');
  });

  it('tile for complaintsOpen has data-accent="coral"', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-complaintsOpen').getAttribute('data-accent')).toBe('coral');
  });

  it('tile for techsOnDuty has data-accent="teal"', () => {
    render(<CounterStrip summary={baseSummary} />);
    expect(screen.getByTestId('tile-techsOnDuty').getAttribute('data-accent')).toBe('teal');
  });
});

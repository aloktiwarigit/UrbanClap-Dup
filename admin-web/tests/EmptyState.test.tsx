// admin-web/tests/EmptyState.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/EmptyState';

describe('<EmptyState />', () => {
  it('renders eyebrow, headline, and copy', () => {
    render(
      <EmptyState
        eyebrow="Live Feed"
        headline="No bookings yet tonight"
        copy="The feed will fill in as bookings land."
      />,
    );
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no bookings yet tonight/i })).toBeInTheDocument();
    expect(screen.getByText(/feed will fill in/i)).toBeInTheDocument();
  });

  it('omits copy when prop is undefined', () => {
    const { container } = render(
      <EmptyState eyebrow="Map" headline="No technicians on duty" />,
    );
    expect(container.querySelectorAll('p')).toHaveLength(0); // no copy paragraph
  });

  it('renders as a region landmark with the headline as accessible name', () => {
    render(<EmptyState eyebrow="Eyebrow" headline="The headline" />);
    const region = screen.getByRole('region', { name: /the headline/i });
    expect(region).toBeInTheDocument();
  });
});

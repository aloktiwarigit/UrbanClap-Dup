import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Topbar } from '../../../src/components/dashboard/Topbar';

describe('Topbar default city', () => {
  const previousCityEnv = process.env.NEXT_PUBLIC_CITY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CITY;
  });

  afterEach(() => {
    if (previousCityEnv === undefined) {
      delete process.env.NEXT_PUBLIC_CITY;
    } else {
      process.env.NEXT_PUBLIC_CITY = previousCityEnv;
    }
  });

  it('falls back to Ayodhya when NEXT_PUBLIC_CITY is unset', () => {
    render(<Topbar />);
    expect(screen.getByText(/Ayodhya/i)).toBeInTheDocument();
  });

  it('does not render the legacy Bengaluru fallback', () => {
    render(<Topbar />);
    expect(screen.queryByText(/Bengaluru/i)).not.toBeInTheDocument();
  });
});

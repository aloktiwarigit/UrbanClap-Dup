import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from '../app/page';

beforeAll(() => {
  // Pin env so the footer is deterministic regardless of CI/local state.
  // Without this, CI sets NEXT_PUBLIC_GIT_SHA at job scope (admin-ship.yml) and the
  // footer renders the 8-char SHA instead of the 'dev' fallback this test asserts.
  process.env.NEXT_PUBLIC_APP_VERSION = '0.1.0';
  delete process.env.NEXT_PUBLIC_GIT_SHA;
});

describe('LandingPage (RSC tree rendered as client tree for assertion)', () => {
  it('renders the brand, tagline, owner-login CTA, and a build-info footer', () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { level: 1, name: /homeservices/i })).toBeDefined();
    expect(screen.getByText(/live operations at a glance/i)).toBeDefined();

    const cta = screen.getByRole('link', { name: /sign in to admin/i });
    expect(cta.getAttribute('href')).toBe('/login');

    expect(screen.getByText(/0\.1\.0/)).toBeDefined();
    expect(screen.getByText(/dev/)).toBeDefined();
  });
});

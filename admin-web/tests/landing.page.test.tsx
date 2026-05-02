import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/api', () => ({
  createApiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    status = 0;
    url = '';
    method = '';
    body: unknown = null;
  },
}));

import { createApiClient } from '@/api';
import LandingPage from '../app/page';

beforeAll(() => {
  // Pin env so the fallback footer is deterministic regardless of CI/local state.
  // Without this, CI sets NEXT_PUBLIC_GIT_SHA at job scope (admin-ship.yml) and the
  // footer renders the 8-char SHA instead of the 'dev' fallback these tests assert.
  process.env.NEXT_PUBLIC_APP_VERSION = '0.1.0';
  delete process.env.NEXT_PUBLIC_GIT_SHA;
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('LandingPage — brand/tagline/CTA + fallback footer', () => {
  it('renders brand, tagline, CTA, and (local) fallback when /v1/health throws', async () => {
    (createApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      GET: vi.fn().mockRejectedValue(new Error('api unreachable')),
    });

    const jsx = await LandingPage();
    render(jsx);

    expect(screen.getByRole('heading', { level: 1, name: /homeservices/i })).toBeDefined();
    expect(screen.getByText(/live operations at a glance/i)).toBeDefined();

    const cta = screen.getByRole('link', { name: /sign in to admin/i });
    expect(cta.getAttribute('href')).toBe('/login');

    expect(screen.getByText(/0\.1\.0/)).toBeDefined();
    expect(screen.getByText(/dev/)).toBeDefined();
    expect(screen.getByText(/\(local\)/)).toBeDefined();
  });
});

describe('LandingPage — /v1/health round-trip', () => {
  it('shows real commit sha + version on successful /v1/health', async () => {
    (createApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      GET: vi.fn().mockResolvedValue({
        data: {
          status: 'ok',
          version: '0.9.7',
          commit: 'cafebabe12345678',
          timestamp: '2026-04-18T00:00:00.000',
          uptimeSeconds: 42,
        },
        error: undefined,
      }),
    });

    const jsx = await LandingPage();
    render(jsx);

    expect(screen.getByText(/0\.9\.7/)).toBeDefined();
    expect(screen.getByText(/cafebabe/)).toBeDefined();
    // Successful round-trip must not render the (local) fallback marker.
    expect(screen.queryByText(/\(local\)/)).toBeNull();
  });

  it('falls back to (local) when /v1/health returns an error envelope', async () => {
    (createApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      GET: vi.fn().mockResolvedValue({
        data: undefined,
        error: { message: 'boom' },
      }),
    });

    const jsx = await LandingPage();
    render(jsx);

    expect(screen.getByText(/\(local\)/)).toBeDefined();
  });
});

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

describe('LandingPage — display headline / CTA / fallback footer (post-rebrand)', () => {
  it('renders the display h1, CTA, and · local fallback marker when /v1/health throws', async () => {
    (createApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      GET: vi.fn().mockRejectedValue(new Error('api unreachable')),
    });

    const jsx = await LandingPage();
    render(jsx);

    // Editorial rebrand replaced the old "homeservices" h1 + tagline with the
    // display headline. Brand is now a small italic-serif <p>, not a heading.
    expect(screen.getByRole('heading', { level: 1, name: /operate the field/i })).toBeDefined();

    const cta = screen.getByRole('link', { name: /sign in to admin/i });
    expect(cta.getAttribute('href')).toBe('/login');

    // Footer fallback marker — rebrand changed "(local)" to " · local".
    // Version is rendered in both the header (sm:inline) and the footer.
    expect(screen.getAllByText(/0\.1\.0/).length).toBeGreaterThan(0);
    expect(screen.getByText(/· local/)).toBeDefined();
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

    // Version renders in both the header and footer.
    expect(screen.getAllByText(/0\.9\.7/).length).toBeGreaterThan(0);
    expect(screen.getByText(/cafebabe/)).toBeDefined();
    // Successful round-trip must not render the · local fallback marker.
    expect(screen.queryByText(/· local/)).toBeNull();
  });

  it('falls back to · local when /v1/health returns an error envelope', async () => {
    (createApiClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      GET: vi.fn().mockResolvedValue({
        data: undefined,
        error: { message: 'boom' },
      }),
    });

    const jsx = await LandingPage();
    render(jsx);

    expect(screen.getByText(/· local/)).toBeDefined();
  });
});

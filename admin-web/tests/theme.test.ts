import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { readThemeCookie, THEME_COOKIE_NAME, type Theme } from '@/lib/theme';

describe('readThemeCookie', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns "dark" by default when cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    expect(await readThemeCookie()).toBe<Theme>('dark');
  });

  it('returns "light" when cookie value is "light"', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === THEME_COOKIE_NAME ? { value: 'light' } : undefined),
    } as never);
    expect(await readThemeCookie()).toBe<Theme>('light');
  });

  it('falls back to "dark" for any unrecognised cookie value', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: 'midnight' }),
    } as never);
    expect(await readThemeCookie()).toBe<Theme>('dark');
  });
});

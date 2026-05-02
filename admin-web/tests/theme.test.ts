import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { readThemeCookie, THEME_COOKIE_NAME, type Theme } from '@/lib/theme';
import { setThemeCookie } from '../app/actions/theme';

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

describe('setThemeCookie (Server Action)', () => {
  it('writes "light" when called with "light"', async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ set, get: () => undefined } as never);
    await setThemeCookie('light');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'theme', value: 'light' }),
    );
  });

  it('rejects unrecognised theme values', async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ set, get: () => undefined } as never);
    await expect(setThemeCookie('midnight' as never)).rejects.toThrow();
    expect(set).not.toHaveBeenCalled();
  });
});

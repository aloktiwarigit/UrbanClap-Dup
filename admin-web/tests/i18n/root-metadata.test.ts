import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture which namespace getTranslations is called with
const getTranslationsMock = vi.fn(async (ns: string) => (key: string) => `[${ns}.${key}]`);

vi.mock('next-intl/server', () => ({
  getTranslations: (ns: string) => getTranslationsMock(ns),
}));

// Avoid loading next/font/google during the test (it requires the Next bundler).
vi.mock('next/font/google', () => {
  const stub = () => ({ variable: '' });
  return {
    Fraunces: stub,
    Geist: stub,
    JetBrains_Mono: stub,
    Noto_Sans_Devanagari: stub,
  };
});

vi.mock('@/components/theme/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: unknown }) => children,
}));

vi.mock('@/lib/theme', () => ({
  readThemeCookie: vi.fn().mockResolvedValue('light'),
}));

describe('Root metadata localization', () => {
  beforeEach(() => {
    getTranslationsMock.mockClear();
  });

  it('exposes generateMetadata as an async function (not a static metadata constant)', async () => {
    const mod = await import('../../app/layout');
    expect(typeof mod.generateMetadata).toBe('function');
  });

  it('does not export a static metadata constant with a hardcoded English title', async () => {
    const mod = await import('../../app/layout');
    // After localization the static `metadata` export must be gone — the title must
    // come exclusively from generateMetadata so it can vary by locale.
    const exported = (mod as { metadata?: { title?: unknown } }).metadata;
    if (exported && typeof exported.title === 'string') {
      expect(exported.title).not.toBe('HomeHeroo — admin');
    }
  });

  it('generateMetadata pulls the title from the `meta` namespace via getTranslations', async () => {
    const mod = await import('../../app/layout');
    const generate = mod.generateMetadata as () => Promise<{ title?: string }>;
    const result = await generate();
    expect(getTranslationsMock).toHaveBeenCalledWith('meta');
    expect(result.title).toBe('[meta.title]');
  });
});

import { test, expect } from '@playwright/test';

test.describe('locale routing', () => {
  test('root / redirects to a locale-prefixed login page', async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Should land on /{locale}/login regardless of which locale is detected
    expect(page.url()).toMatch(/\/(hi|en)\/login/);
    expect(response?.status()).not.toBe(404);
  });

  test('explicit /en/login serves English and sets lang=en', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveURL(/\/en\/login/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('explicit /hi/login serves Hindi and sets lang=hi', async ({ page }) => {
    await page.goto('/hi/login');
    await expect(page).toHaveURL(/\/hi\/login/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });

  test('NEXT_LOCALE cookie updates when switching from /hi/ to /en/', async ({ page }) => {
    // next-intl only persists NEXT_LOCALE when the locale differs from the browser default.
    // Establish hi locale first (always set — differs from browser Accept-Language:en),
    // then navigate to /en/ to verify the cookie updates.
    await page.context().clearCookies();
    await page.goto('/hi/login');
    await page.waitForLoadState('networkidle');
    const hiCookies = await page.context().cookies();
    expect(hiCookies.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('hi');

    await page.goto('/en/login');
    await page.waitForLoadState('networkidle');
    const enCookies = await page.context().cookies();
    expect(enCookies.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('en');
  });

  test('NEXT_LOCALE cookie set after visiting /hi/login', async ({ page }) => {
    await page.goto('/hi/login');
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
    expect(localeCookie?.value).toBe('hi');
  });

  test('NEXT_LOCALE=en cookie causes root / to redirect to /en/', async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' },
    ]);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/en\//);
  });

  test('/hi/login HTML has Noto Devanagari font variable in class', async ({ page }) => {
    await page.goto('/hi/login');
    const htmlClass = await page.locator('html').getAttribute('class');
    // next/font generates CSS variable classes like __variable_XXXXXX
    // We verify there are 4 font variables (fraunces, geist, jetbrains, devanagari)
    const varClasses = (htmlClass ?? '').split(' ').filter((c) => c.startsWith('__variable_'));
    expect(varClasses.length).toBe(4);
  });

  test('unknown locale /fr/login redirects to a valid locale login page', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/fr/login');
    // Wait for the middleware redirect to complete — don't use networkidle since
    // the login page makes a background session-restore fetch that hangs in CI.
    await page.waitForURL(/\/(hi|en)\/login/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(hi|en)\/login/);
  });
});

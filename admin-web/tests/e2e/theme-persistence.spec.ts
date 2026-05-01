import { test, expect } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('theme persistence', () => {
  test('cookie-set "light" produces light first byte (no FOUC)', async ({ request }) => {
    // Hit the server directly — no client JS runs, so what we see IS the SSR output.
    const res = await request.get('http://localhost:3000/', {
      headers: { Cookie: 'theme=light' },
    });
    expect(res.status()).toBe(200);
    const html = await res.text();
    // The opening <html ...> tag must already carry data-theme="light".
    const htmlTag = /<html[^>]*>/.exec(html)?.[0] ?? '';
    expect(htmlTag).toContain('data-theme="light"');
    expect(htmlTag).not.toContain('data-theme="dark"');
  });

  test('theme survives App Router client navigation between dashboard routes', async ({ page, context }) => {
    const jwt = await makeAccessJwt('admin-e2e', 'admin');
    await context.addCookies([
      { name: 'hs_access', value: jwt, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
      { name: 'theme', value: 'light', url: 'http://localhost:3000' },
    ]);

    await page.goto('/dashboard');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    // Click the Rail's Orders link — App Router client-side navigation,
    // which is what intermittently dropped data-theme in the punch list.
    await page.getByRole('link', { name: /^orders$/i }).click();
    await page.waitForURL('**/orders');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    await page.getByRole('link', { name: /^finance$/i }).click();
    await page.waitForURL('**/finance');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');
  });

  test('clicking the toggle persists the new theme across reload', async ({ page, context }) => {
    const jwt = await makeAccessJwt('admin-e2e', 'admin');
    await context.addCookies([
      { name: 'hs_access', value: jwt, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/dashboard');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('dark');

    // Click the LIGHT option in the Topbar toggle.
    await page.getByRole('radio', { name: /^light$/i }).click();
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');

    // Reload — the cookie write must have completed and the server must SSR light.
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe('light');
    // And the toggle reflects the persisted state.
    await expect(page.getByRole('radio', { name: /^light$/i })).toHaveAttribute('aria-checked', 'true');
  });
});

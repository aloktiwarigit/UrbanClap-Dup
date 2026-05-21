import { test, expect } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';

test.describe('404 not-found page', () => {
  test('navigating to a non-existent locale route returns 404 with themed page', async ({
    page,
    context,
    baseURL,
  }) => {
    // Authenticate so middleware passes through to the not-found handler.
    const jwt = await makeAccessJwt('notfound-e2e', 'super-admin');
    await context.addCookies([
      {
        name: 'hs_access',
        value: jwt,
        url: baseURL ?? 'http://localhost:3000',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const response = await page.goto('/hi/no-such-route-that-does-not-exist');

    // Must be a 404, not a redirect to login (302) or a silent 200.
    expect(response?.status()).toBe(404);

    // Page must contain the Hindi not-found description (visible on /hi locale).
    await expect(page.locator('body')).toContainText('पृष्ठ नहीं मिला');

    // A back-home link must exist and be keyboard-reachable.
    const backLink = page.getByRole('link', { name: /डैशबोर्ड|dashboard/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /dashboard/);
  });

  test('navigating to a non-existent English locale route returns 404', async ({
    page,
    context,
    baseURL,
  }) => {
    const jwt = await makeAccessJwt('notfound-en-e2e', 'super-admin');
    await context.addCookies([
      {
        name: 'hs_access',
        value: jwt,
        url: baseURL ?? 'http://localhost:3000',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const response = await page.goto('/en/no-such-route-that-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toContainText('Page not found');
    const backLink = page.getByRole('link', { name: /dashboard/i });
    await expect(backLink).toBeVisible();
  });
});

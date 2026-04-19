import { test, expect } from '@playwright/test';

test('expired session redirects to /login', async ({ page }) => {
  await page.route('**/api/v1/admin/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: JSON.stringify({ code: 'SESSION_EXPIRED' }) }),
  );
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

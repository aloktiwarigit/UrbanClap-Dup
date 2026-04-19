import { test, expect } from '@playwright/test';

test('finance role cannot access super-admin-only action', async ({ page }) => {
  await page.route('**/api/v1/admin/catalogue**', (route) =>
    route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'FORBIDDEN', requiredRoles: ['super-admin'] }),
    }),
  );
  await page.goto('/dashboard');
  const res = await page.evaluate(() =>
    fetch('/api/v1/admin/catalogue', { credentials: 'include' }).then((r) => r.status),
  );
  expect(res).toBe(403);
});

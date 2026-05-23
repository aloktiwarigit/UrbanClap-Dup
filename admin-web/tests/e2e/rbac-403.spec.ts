import { test, expect } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';

test('finance role is redirected away from super-admin-only routes', async ({ page, context, baseURL }) => {
  const jwt = await makeAccessJwt('finance-e2e', 'finance');
  await context.addCookies([
    {
      name: 'hs_access',
      value: jwt,
      url: baseURL ?? 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await page.goto('/audit-log');
  await expect(page).toHaveURL(/\/not-authorized/);
  await expect(page.getByRole('heading', { name: /do not have access/i })).toBeVisible();
});

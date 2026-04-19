import { test, expect } from '@playwright/test';
import { makeAccessJwt, makeFakeFirebaseIdToken } from './helpers/make-token';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    const cookieToken = await makeAccessJwt('u1', 'super-admin');
    const firebaseIdToken = await makeFakeFirebaseIdToken('uid123', 'admin@test.com');
    await page.route('**/identitytoolkit.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          idToken: firebaseIdToken,
          email: 'admin@test.com',
          refreshToken: 'mock-refresh',
          expiresIn: '3600',
          localId: 'uid123',
          registered: true,
        }),
      }),
    );
    await page.route('**/api/v1/admin/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1', role: 'super-admin', email: 'a@b.com' }),
        headers: { 'set-cookie': `hs_access=${cookieToken}; Path=/; HttpOnly` },
      }),
    );
  });

  test('successful login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.fill('input[inputmode="numeric"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('wrong TOTP shows inline error', async ({ page }) => {
    await page.route('**/api/v1/admin/auth/login', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'TOTP_INVALID' }),
      }),
    );
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.fill('input[inputmode="numeric"]', '000000');
    await page.click('button[type="submit"]');
    await expect(page.locator('p[role="alert"]')).toContainText('Invalid authenticator code');
    await expect(page).toHaveURL(/\/login/);
  });
});

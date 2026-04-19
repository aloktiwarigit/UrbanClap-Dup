import { test, expect } from '@playwright/test';
import { makeAccessJwt, makeFakeFirebaseIdToken } from './helpers/make-token';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    const cookieToken = await makeAccessJwt('u1', 'super-admin');
    const firebaseIdToken = await makeFakeFirebaseIdToken('uid123', 'admin@test.com');

    // Firebase sign-in + accounts:lookup (called by SDK after sign-in to populate user profile)
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => {
      const url = route.request().url();
      if (url.includes('accounts:lookup') || url.includes('getAccountInfo')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [{ localId: 'uid123', email: 'admin@test.com', emailVerified: false }],
          }),
        });
      }
      return route.fulfill({
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
      });
    });

    // securetoken.googleapis.com — called by getIdToken() if the cached token needs refresh
    await page.route('**/securetoken.googleapis.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id_token: firebaseIdToken,
          access_token: firebaseIdToken,
          expires_in: '3600',
          token_type: 'Bearer',
          refresh_token: 'mock-refresh',
          user_id: 'uid123',
          project_id: 'placeholder-project-id',
        }),
      }),
    );

    // Use addCookies() in the handler — more reliable than set-cookie header in route.fulfill()
    await page.route('**/api/v1/admin/auth/login', async (route) => {
      await page.context().addCookies([{
        name: 'hs_access',
        value: cookieToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1', role: 'super-admin', email: 'a@b.com' }),
      });
    });
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

import { test, expect } from '@playwright/test';
import { makeAccessJwt, makeFakeFirebaseIdToken } from './helpers/make-token';

test.describe('TOTP enrollment (first login)', () => {
  test('redirects to /setup after first login and shows QR code', async ({ page }) => {
    const firebaseIdToken = await makeFakeFirebaseIdToken('uid123', 'admin@test.com');

    // Firebase sign-in + accounts:lookup (called by SDK after sign-in)
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

    await page.route('**/api/v1/admin/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ requiresSetup: true, setupToken: 'mock.setup.token' }),
      }),
    );

    await page.route('**/api/v1/admin/auth/setup-totp', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            qrCodeDataUri:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1' }),
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/setup/);
    await expect(page.getByAltText('TOTP QR code')).toBeVisible();
  });

  test('completes enrollment and redirects to /dashboard', async ({ page }) => {
    const token = await makeAccessJwt('u1', 'super-admin');
    await page.addInitScript(() => {
      sessionStorage.setItem('setupToken', 'mock.setup.token');
    });
    await page.route('**/api/v1/admin/auth/setup-totp', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ qrCodeDataUri: 'data:image/png;base64,abc' }),
        });
      }
      // Use addCookies() — more reliable than set-cookie header in route.fulfill()
      await page.context().addCookies([{
        name: 'hs_access',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1' }),
      });
    });

    await page.goto('/setup');
    await expect(page.getByAltText('TOTP QR code')).toBeVisible();
    await page.fill('input[inputmode="numeric"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

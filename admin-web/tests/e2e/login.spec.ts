import { test, expect } from '@playwright/test';
import { makeAccessJwt, makeFakeFirebaseIdToken } from './helpers/make-token';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    const firebaseIdToken = await makeFakeFirebaseIdToken('uid123', 'admin@test.com');

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
  });

  test('successful login completes Microsoft Authenticator and redirects to /dashboard', async ({ page }) => {
    const cookieToken = await makeAccessJwt('u1', 'super-admin');
    await page.route('**/admin-api/v1/admin/auth/login', async (route) => {
      const body = route.request().postDataJSON() as { idToken?: string };
      if (body.idToken) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            mfaRequired: true,
            challengeToken: 'mfa.challenge.token',
            email: 'admin@test.com',
          }),
        });
      }

      await page.context().addCookies([{
        name: 'hs_access',
        value: cookieToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1', role: 'super-admin', email: 'admin@test.com' }),
      });
    });

    await page.goto('/en/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.getByRole('button', { name: /sign in with password/i }).click();
    await expect(page.getByRole('heading', { name: /open microsoft authenticator/i })).toBeVisible();
    await page.getByLabel(/microsoft authenticator code/i).fill('123456');
    await page.getByRole('button', { name: /verify microsoft authenticator/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('wrong Microsoft Authenticator code shows inline error', async ({ page }) => {
    await page.route('**/admin-api/v1/admin/auth/login', (route) => {
      const body = route.request().postDataJSON() as { idToken?: string };
      if (body.idToken) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            mfaRequired: true,
            challengeToken: 'mfa.challenge.token',
            email: 'admin@test.com',
          }),
        });
      }
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'TOTP_INVALID' }),
      });
    });

    await page.goto('/en/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.getByRole('button', { name: /sign in with password/i }).click();
    await page.getByLabel(/microsoft authenticator code/i).fill('000000');
    await page.getByRole('button', { name: /verify microsoft authenticator/i }).click();
    await expect(page.locator('p[role="alert"]')).toContainText('Microsoft Authenticator code did not match');
    await expect(page).toHaveURL(/\/login/);
  });
});

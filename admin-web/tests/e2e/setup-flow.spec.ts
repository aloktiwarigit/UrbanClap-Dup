import { test, expect } from '@playwright/test';
import { makeAccessJwt, makeFakeFirebaseIdToken } from './helpers/make-token';

test.describe('Setup flow — HttpOnly cookie path (E12-S07)', () => {
  test('after login, sessionStorage does NOT contain setupToken (cookie path)', async ({ page }) => {
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

    // Login API returns requiresSetup — server sets hs_setup cookie via Set-Cookie header.
    await page.route('**/admin-api/v1/admin/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // hs_setup is delivered as an HttpOnly cookie by the API server.
        // Path=/ is required because the server-side exchange runs under /api.
        headers: {
          'set-cookie':
            'hs_setup=mock.setup.token; HttpOnly; Path=/; Max-Age=600; SameSite=Strict',
        },
        body: JSON.stringify({ requiresSetup: true, setupToken: 'mock.setup.token' }),
      }),
    );

    // Intercept the setup-token exchange endpoint to avoid needing a real server.
    await page.route('**/api/setup-token/exchange', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock.setup.token' }),
      }),
    );

    // Intercept setup-totp GET (QR fetch) so /setup doesn't redirect back.
    await page.route('**/admin-api/v1/admin/auth/setup-totp', (route) => {
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

    // Should navigate to /setup
    await expect(page).toHaveURL(/\/setup/);

    // The critical assertion: sessionStorage MUST NOT contain setupToken.
    const storedToken = await page.evaluate(() => sessionStorage.getItem('setupToken'));
    expect(storedToken).toBeNull();
  });

  test('setup page loads QR code via exchange endpoint (not sessionStorage)', async ({ page }) => {
    // Intercept the exchange endpoint — no sessionStorage pre-seeding needed.
    await page.route('**/api/setup-token/exchange', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock.setup.token.from.cookie' }),
      }),
    );

    await page.route('**/admin-api/v1/admin/auth/setup-totp', (route) => {
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
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/setup');
    await expect(page.getByAltText('Microsoft Authenticator setup QR code')).toBeVisible();
    // sessionStorage must still be null — the QR was fetched via exchange endpoint.
    const storedToken = await page.evaluate(() => sessionStorage.getItem('setupToken'));
    expect(storedToken).toBeNull();
  });

  test('setup page redirects to /login when exchange returns 401', async ({ page }) => {
    // Exchange returns 401 — no hs_setup cookie present.
    await page.route('**/api/setup-token/exchange', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SETUP_TOKEN_MISSING' }),
      }),
    );

    await page.goto('/setup');
    await expect(page).toHaveURL(/\/login/);
  });

  test('completes enrollment after exchange and redirects to /dashboard', async ({ page }) => {
    const token = await makeAccessJwt('u1', 'super-admin');

    await page.route('**/api/setup-token/exchange', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock.setup.token' }),
      }),
    );

    await page.route('**/admin-api/v1/admin/auth/setup-totp', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ qrCodeDataUri: 'data:image/png;base64,abc' }),
        });
      }
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
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ adminId: 'u1' }),
      });
    });

    await page.goto('/setup');
    await expect(page.getByAltText('Microsoft Authenticator setup QR code')).toBeVisible();
    await page.fill('input[inputmode="numeric"]', '123456');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

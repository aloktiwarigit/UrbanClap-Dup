import { test, expect } from '@playwright/test';

test.describe('TOTP enrollment (first login)', () => {
  test('redirects to /setup after first login and shows QR code', async ({ page }) => {
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
    await page.addInitScript(() => {
      sessionStorage.setItem('setupToken', 'mock.setup.token');
    });
    await page.route('**/api/v1/admin/auth/setup-totp', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ qrCodeDataUri: 'data:image/png;base64,abc' }),
        });
      }
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

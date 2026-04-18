import { test, expect } from '@playwright/test';

test('landing page renders brand + tagline + CTA + footer build-info', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: /homeservices/i })).toBeVisible();
  await expect(page.getByText(/live operations at a glance/i)).toBeVisible();

  const cta = page.getByRole('link', { name: /sign in to admin/i });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', '/login');

  await expect(page.locator('footer')).toContainText('v');
});

test('CTA navigates to /login stub', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sign in to admin/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText(/501 — Owner sign-in coming/i)).toBeVisible();
});

test('dark mode toggle changes computed background color', async ({ page }) => {
  await page.goto('/');
  const initialBg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
  );
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  const darkBg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
  );
  expect(darkBg).not.toBe(initialBg);
  expect(darkBg).not.toBe('');
});

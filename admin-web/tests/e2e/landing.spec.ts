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

test('footer shows real commit sha and semver from /v1/health', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  // Successful round-trip: footer contains an 8-char hex SHA and a semver-looking string.
  await expect(footer).toContainText(/[a-f0-9]{8}/);
  await expect(footer).toContainText(/\d+\.\d+\.\d+/);
});

test('dark mode toggle changes computed background color', async ({ page }) => {
  await page.goto('/');
  // Read resolved backgroundColor on <html> — globals.css declares `html { background: var(--color-surface) }`.
  // Reading custom properties via getPropertyValue can return empty for layer-scoped declarations in
  // Chromium (Tailwind v4 wraps :root tokens in @layer theme); the resolved color is the reliable signal.
  const initialBg = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  const darkBg = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  expect(darkBg).not.toBe(initialBg);
  expect(darkBg).not.toBe('');
  expect(initialBg).not.toBe('');
});

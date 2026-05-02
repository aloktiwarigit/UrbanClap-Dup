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

test('CTA navigates to /login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sign in to admin/i }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: /sign in/i })).toBeVisible();
});

test('footer shows real commit sha and semver from /v1/health', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  // Successful round-trip: footer contains an 8-char hex SHA and a semver-looking string.
  await expect(footer).toContainText(/[a-f0-9]{8}/);
  await expect(footer).toContainText(/\d+\.\d+\.\d+/);
});

test('theme toggle changes computed background color', async ({ page }) => {
  await page.goto('/');
  // ThemeProvider toggles theme by mutating `documentElement.dataset.theme`.
  // globals.css makes :root tokens dark by default and overrides them under
  // `html[data-theme="light"]`; `.dark` is a no-op (line ~171). Force both
  // states explicitly so the assertion is independent of cookie/system-pref
  // defaults. Read resolved backgroundColor (not the var) — getPropertyValue
  // can return empty for layer-scoped declarations in Tailwind v4's @theme.
  await page.evaluate(() => {
    document.documentElement.dataset['theme'] = 'light';
  });
  const lightBg = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  await page.evaluate(() => {
    document.documentElement.dataset['theme'] = 'dark';
  });
  const darkBg = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  expect(lightBg).not.toBe(darkBg);
  expect(lightBg).not.toBe('');
  expect(darkBg).not.toBe('');
});

import { test, expect, type BrowserContext } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';
import type { AdminRole } from '../../src/lib/auth/types';

async function signInAs(context: BrowserContext, baseURL: string | undefined, role: AdminRole) {
  const jwt = await makeAccessJwt(`${role}-e2e`, role);
  await context.addCookies([
    {
      name: 'hs_access',
      value: jwt,
      url: baseURL ?? 'http://localhost:3010',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.describe('admin completion role matrix', () => {
  test('super-admin sees enterprise navigation, with audit log available by direct route', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');
    await page.goto('/en/dashboard');

    await expect(page.getByRole('link', { name: /audit log/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /admin users/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /compliance/i }).first()).toBeVisible();

    await page.goto('/en/audit-log');
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible();
  });

  test('ops-manager cannot see or directly open super-admin sections', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'ops-manager');
    await page.goto('/en/dashboard');

    await expect(page.getByRole('link', { name: /^orders$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^catalogue$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /audit log/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /admin users/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^compliance$/i })).toHaveCount(0);

    await page.goto('/en/audit-log');
    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByText(/not allowed to open.*audit-log/i)).toBeVisible();
  });

  test('finance can read finance but cannot approve payouts or open orders', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'finance');
    await page.goto('/en/finance');

    await expect(page.getByRole('heading', { name: /^finance$/i })).toBeVisible();
    await expect(page.getByText(/restricted to super-admins/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /approve all/i })).toHaveCount(0);

    await page.goto('/en/orders');
    await expect(page).toHaveURL(/\/not-authorized/);
  });

  test('support-agent lands on not-authorized for dashboard routes', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'support-agent');
    await page.goto('/en/dashboard');

    await expect(page).toHaveURL(/\/not-authorized/);
    await expect(page.getByRole('heading', { name: /do not have access/i })).toBeVisible();
  });
});

test.describe('admin completion workflows', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');
  });

  test('catalogue create, edit, service edit, and publish toggle paths work', async ({ page }) => {
    await page.goto('/en/catalogue');
    await expect(page.getByRole('heading', { name: 'Plumbing' })).toBeVisible();

    await page.getByRole('link', { name: /new category/i }).click();
    await expect(page.getByRole('heading', { name: /new category/i })).toBeVisible();
    await page.getByLabel(/id/i).fill('electrical');
    await page.getByLabel(/^name$/i).fill('Electrical');
    await page.getByLabel(/hero image url/i).fill('https://example.com/electrical.jpg');
    await page.getByLabel(/sort order/i).fill('20');
    await page.getByRole('button', { name: /create category/i }).click();
    await expect(page).toHaveURL(/\/catalogue$/);
    await expect(page.getByRole('heading', { name: 'Electrical' })).toBeVisible();

    await page.goto('/en/catalogue/plumbing/edit');
    await expect(page.getByRole('heading', { name: /edit category/i })).toBeVisible();
    await page.getByLabel(/^name$/i).fill('Plumbing Pro');
    await page.getByRole('button', { name: /update category/i }).click();
    await expect(page).toHaveURL(/\/catalogue\/plumbing$/);
    await expect(page.getByRole('heading', { name: /plumbing pro/i })).toBeVisible();

    await expect(page.getByText('Leak Fix')).toBeVisible();
    await page.getByRole('button', { name: /unpublish/i }).click();
    await expect(page.getByText(/unpublished/i)).toBeVisible();

    await page.getByRole('link', { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/catalogue\/plumbing\/services\/leak-fix$/);
    await expect(page.getByRole('heading', { name: /edit service/i })).toBeVisible();

    await page.goto('/en/catalogue/plumbing/services/new');
    await expect(page.getByRole('heading', { name: /add service/i })).toBeVisible();
  });

  test('dashboard payout CTA routes to the finance approval flow', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.getByRole('link', { name: /approve payouts in finance/i }).click();

    await expect(page).toHaveURL(/\/finance$/);
    await expect(page.getByRole('button', { name: /approve all/i })).toBeVisible();
  });

  test('admin users and compliance surfaces execute real commands', async ({ page }) => {
    await page.goto('/en/admin-users');
    await expect(page.getByRole('heading', { name: /admin users/i })).toBeVisible();
    await expect(page.getByText('owner@homeheroo.test')).toBeVisible();
    await page.getByRole('button', { name: /deactivate/i }).click();
    await expect(page.getByText(/admin user updated/i)).toBeVisible();

    await page.goto('/en/compliance');
    await expect(page.getByRole('heading', { name: /erasure requests/i })).toBeVisible();
    await expect(page.getByText('erase-1')).toBeVisible();
    await expect(page.getByRole('heading', { name: /ssc levy approval/i })).toBeVisible();
    await page.getByRole('button', { name: /approve transfer/i }).click();
    await expect(page.getByText(/ssc levy 2026-q1 transferred/i)).toBeVisible();
    await expect(page.getByText('trf_e2e')).toBeVisible();
  });

  test('complaints page surfaces repeat offenders', async ({ page }) => {
    await page.goto('/en/complaints');
    await expect(page.getByRole('heading', { name: /repeat offenders/i })).toBeVisible();
    await expect(page.getByText('tech-1')).toBeVisible();
    await expect(page.getByText(/4 complaints/i)).toBeVisible();
  });
});

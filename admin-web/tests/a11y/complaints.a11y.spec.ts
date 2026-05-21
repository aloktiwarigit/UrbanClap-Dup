import { test, expect, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { makeAccessJwt } from '../e2e/helpers/make-token';

async function signInAs(context: BrowserContext, baseURL: string | undefined, role: string) {
  const jwt = await makeAccessJwt(`${role}-a11y`, role);
  await context.addCookies([{
    name: 'hs_access',
    value: jwt,
    url: baseURL ?? 'http://localhost:3000',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
}

test.describe('complaints route a11y', () => {
  test('complaints page has no critical/serious WCAG 2.1 AA violations', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');

    await page.goto('/en/complaints');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['scope-attr-valid'])
      .analyze();

    const blocking = results.violations.filter(v =>
      ['critical', 'serious'].includes(v.impact ?? ''),
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('ComplaintSlideOver traps focus and closes on Escape', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');
    // Complaints are server-fetched; the mock API seeds one complaint for this test.
    await page.goto('/en/complaints');
    const card = page.locator('[draggable="true"]').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Tab — focus should stay inside the dialog (FocusLock)
    await page.keyboard.press('Tab');
    const focusedInsideDialog = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return dlg?.contains(document.activeElement) ?? false;
    });
    expect(focusedInsideDialog).toBe(true);

    // ESC — dialog should close
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});

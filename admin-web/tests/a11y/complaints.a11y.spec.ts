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

    await page.goto('/en/complaints', { waitUntil: 'domcontentloaded' });
    // Wait for the seeded complaint card to render so axe scans the populated kanban
    // (not the loading state). Without this, CI scans with card visible while local
    // may scan with empty state — divergent contrast violations.
    await page.waitForSelector('[data-rfd-draggable-id]', { timeout: 10_000 });

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
    await page.goto('/en/complaints', { waitUntil: 'domcontentloaded' });
    // @hello-pangea/dnd sets draggable=false on the container; target the card by its complaint ID attribute.
    const card = page.locator('[data-rfd-draggable-id="a11y-complaint-001"]');
    await expect(card).toBeVisible({ timeout: 10_000 });

    const dialog = page.getByRole('dialog');
    // The complaint card is present in the server-rendered HTML the instant
    // `waitUntil: 'domcontentloaded'` resolves, so it can become "visible" to
    // Playwright before React finishes hydrating and attaches the card's
    // onClick handler. Under CPU contention (parallel workers, a loaded CI
    // runner) hydration can lag far enough that a single click lands on a
    // still-inert DOM node and is silently dropped — confirmed by instrumenting
    // this click under 8-way parallel load: ~40% of attempts left
    // document.activeElement on the un-hydrated card with zero dialogs open,
    // no console/page errors. Retrying the click (not just waiting longer
    // before the first one) is what actually clears this: each retry runs
    // after strictly more time has passed, so it succeeds as soon as
    // hydration has caught up, whereas a single click that lands too early is
    // gone for good no matter how long we wait afterwards.
    await expect(async () => {
      await card.click();
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });

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

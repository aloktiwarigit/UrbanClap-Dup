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

test('audit-log page has no critical/serious WCAG 2.1 AA violations', async ({ page, context, baseURL }) => {
  await signInAs(context, baseURL, 'super-admin');
  await page.goto('/en/audit-log', { waitUntil: 'domcontentloaded' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(['scope-attr-valid'])
    .analyze();

  const blocking = results.violations.filter(v =>
    ['critical', 'serious'].includes(v.impact ?? ''),
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

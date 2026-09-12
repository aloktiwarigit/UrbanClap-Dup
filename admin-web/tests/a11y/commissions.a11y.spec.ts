import { test, expect, type BrowserContext, type Page } from '@playwright/test';
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

const now = '2026-05-04T12:00:00.000Z';

async function mockDashboard(page: Page) {
  await page.route('**/admin-api/v1/admin/finance/commission-receivables', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        technicians: [
          {
            technicianId: 'tech-1',
            technicianName: 'Suresh Kumar',
            outstandingPaise: 184258,
            dueCount: 3,
            oldestDueAt: '2026-04-20T00:00:00.000Z',
            state: 'WARN',
            evaluatedAt: now,
            staleAfter: '2026-05-05T00:00:00.000Z',
          },
          {
            technicianId: 'tech-2',
            technicianName: 'Ramesh Verma',
            outstandingPaise: 500000,
            dueCount: 6,
            oldestDueAt: '2026-04-10T00:00:00.000Z',
            state: 'BLOCKED',
            evaluatedAt: now,
            staleAfter: '2026-05-05T00:00:00.000Z',
            override: { until: '2026-06-01T00:00:00.000Z', byAdminId: 'super-e2e', reason: 'Payment plan agreed' },
          },
        ],
        totalOutstanding: 684258,
        unreconciledTechnicianCount: 0,
      }),
    }),
  );
}

async function mockTechnicianLedger(page: Page, technicianId: string) {
  await page.route(`**/admin-api/v1/admin/finance/commission-receivables/${technicianId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        technicianId,
        hold: {
          outstandingPaise: 184258,
          dueCount: 3,
          oldestDueAt: '2026-04-20T00:00:00.000Z',
          state: 'WARN',
          evaluatedAt: now,
        },
        receivables: [
          {
            id: 'r1',
            bookingId: 'booking-1',
            technicianId,
            partitionKey: technicianId,
            serviceId: 'leak-fix',
            categoryId: 'plumbing',
            bookingAmount: 59900,
            commissionBps: 2250,
            commissionDue: 13478,
            commissionResolvedFrom: 'SERVICE',
            remittanceStatus: 'DUE',
            createdAt: '2026-04-20T00:00:00.000Z',
            serviceName: 'Leak Fix',
            slotDate: '2026-04-20T00:00:00.000Z',
            outstandingPaise: 13478,
          },
        ],
        remittances: [],
        credits: [],
        cashCollectedPaise: 59900,
        creditAppliedPaise: 0,
      }),
    }),
  );
}

async function mockCommissionConfig(page: Page) {
  await page.route('**/admin-api/v1/admin/catalogue/commission-config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        defaultCommissionBps: 2250,
        warnThresholdPaise: 150000,
        blockThresholdPaise: 400000,
        holdEnforcementEnabled: true,
        enforceKycInDispatch: true,
        updatedBy: 'seed',
        updatedAt: now,
      }),
    }),
  );
}

test.describe('Commissions a11y', () => {
  // #335: this suite flakes under CI load (~1 in 4-8 runs) beyond the project-wide
  // retries:1 in playwright.config.ts. Root cause not yet confirmed — suspected same
  // class as the hydration race #342 fixed elsewhere, not yet reproduced here in
  // isolation. Quarantine: extra retries absorb the transient flake without losing
  // real coverage (a genuine regression still fails every attempt). Remove this
  // override once the flake is root-caused and fixed; do not raise it further as a
  // way to silence a worsening failure rate.
  test.describe.configure({ retries: 4 });

  test('commissions roll-up has no critical/serious WCAG 2.1 AA violations', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');
    await mockDashboard(page);

    await page.goto('/en/finance/commissions', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Suresh Kumar')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // th scope (P1-6) deferred to a later story — same exemption as finance.a11y.spec.ts
      .disableRules(['scope-attr-valid'])
      .analyze();

    const blocking = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? ''));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('technician commission ledger detail has no critical/serious WCAG 2.1 AA violations', async ({
    page,
    context,
    baseURL,
  }) => {
    await signInAs(context, baseURL, 'super-admin');
    await mockTechnicianLedger(page, 'tech-1');
    await mockCommissionConfig(page);

    await page.goto('/en/finance/commissions/tech-1', { waitUntil: 'domcontentloaded' });
    // "Leak Fix" appears twice on this page — once as the receivable's row cell, once inside the
    // cash-context evidence sentence ("Commission due — Leak Fix"). Assert on the row cell
    // specifically rather than the ambiguous text.
    await expect(page.getByRole('cell', { name: 'Leak Fix', exact: true })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['scope-attr-valid'])
      .analyze();

    const blocking = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? ''));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('remittance drawer traps focus and closes on Escape', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL, 'super-admin');
    // The drawer keys its idempotency reservation off localStorage, scoped per technician
    // (RemittanceDrawer.tsx). A stray key from a previous test run against this same origin
    // would not change anything this test asserts (it never submits), but clearing it up front
    // keeps this test's storage state independent of test order, per the story's own findings.
    await page.addInitScript(() => window.localStorage.clear());
    await mockTechnicianLedger(page, 'tech-1');
    await mockCommissionConfig(page);

    await page.goto('/en/finance/commissions/tech-1', { waitUntil: 'domcontentloaded' });

    const recordPaymentBtn = page.getByRole('button', { name: /record payment/i });
    await expect(recordPaymentBtn).toBeVisible();
    await recordPaymentBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Tab');
    const focusedInsideDialog = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return dlg?.contains(document.activeElement) ?? false;
    });
    expect(focusedInsideDialog).toBe(true);

    // Tab repeatedly — focus must never escape the dialog while it's open (Drawer.tsx wraps
    // its content in FocusLock; this exercises more than the single first Tab above).
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]');
        return dlg?.contains(document.activeElement) ?? false;
      });
      expect(stillInside).toBe(true);
    }

    await page.keyboard.press('Escape');
    // Drawer.tsx returns null when closed — the whole subtree (including [role="dialog"]) is
    // unmounted, not merely hidden, so this must resolve to zero matches, not "not visible".
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

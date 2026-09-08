import { test, expect } from '@playwright/test';
import { makeAccessJwt } from './helpers/make-token';

// Full-stack (through the /admin-api proxy to the mock server in mock-admin-api.mjs) record-
// payment flow: open the ledger for a technician with one ₹134.78 DUE receivable, record a
// ₹100.00 partial payment, and confirm both the ephemeral success toast and the persistent
// balance figure (BalanceStack, refetched from the server after the drawer's onRecorded
// callback) reflect it. Money assertions are on the formatted rupee string the server-computed
// paise figure renders to — never on a float.
test('recording a commission payment updates the toast and the technician balance', async ({
  page,
  context,
  baseURL,
}) => {
  const jwt = await makeAccessJwt('finance-e2e', 'finance');
  await context.addCookies([
    {
      name: 'hs_access',
      value: jwt,
      url: baseURL ?? 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // The remittance drawer's idempotency key is scoped per technician and persisted in
  // localStorage (RemittanceDrawer.tsx) so it survives a reload. Cleared up front so this test
  // never inherits a pending/committed key from an earlier run against the same mock server —
  // otherwise a stale key here replays a receipt instead of recording a fresh payment, and the
  // balance assertion below would fail against a phantom.
  await page.addInitScript(() => window.localStorage.clear());

  await page.goto('/en/finance/commissions/tech-1', { waitUntil: 'domcontentloaded' });

  const balanceStack = page.getByTestId('balance-stack');
  await expect(balanceStack).toContainText('₹134.78');

  await page.getByRole('button', { name: /record payment/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(/amount/i).fill('100');
  // Method select defaults to UPI — leave it. Fill the reference, which is required.
  await dialog.getByLabel(/reference/i).fill('ref-e2e-1');
  await dialog.getByRole('button', { name: /^record payment$/i }).click();

  await expect(dialog.getByText('Payment recorded')).toBeVisible();

  // The drawer deliberately does not close itself on success (RemittanceDrawer.tsx) — close it
  // explicitly so the assertion below reads the ledger page underneath, not the drawer's own
  // "Recorded allocation" preview.
  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).toHaveCount(0);

  // ₹134.78 due − ₹100.00 recorded = ₹34.78 remaining. The receivable stays technically "DUE"
  // (it isn't fully settled) — this is a partial payment, not a status flip — so what must move
  // is the "Balance due" total row, not a status label. The stack's own "Commission due" line
  // legitimately keeps showing ₹134.78 (BalanceStack.tsx: that line is the fixed original due,
  // never reduced by a payment) — asserting the whole stack no longer contains ₹134.78 would be
  // wrong, so this scopes to the specific total row instead.
  const totalRow = balanceStack.locator('div', { hasText: 'Balance due' });
  await expect(totalRow).toContainText('₹34.78');
});

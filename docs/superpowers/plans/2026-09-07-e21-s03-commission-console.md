# E21-S03 Admin Commission Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the E21-S02 commission ledger in front of the owner — a roll-up of who owes what, a per-technician money ledger with repayment recording, and a settings page for rates, thresholds and technician feature flags.

**Architecture:** Almost entirely admin-web. Every screen reads existing E21-S02 endpoints through the typed `createApiClient`. One small API task fills a real gap: E21-S02 shipped the schema, repo method and audit action for `system/technician-client-config` but never wired an HTTP handler, so the flags are unreachable from the UI. All money arithmetic shown is derived client-side from server figures by pure, unit-tested functions — the server remains authoritative for every stored amount.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4 (`@theme` tokens in `app/globals.css`), `next-intl`, `openapi-fetch` typed client, Vitest + RTL, Playwright (a11y + mock-API e2e), Storybook. API side: Azure Functions v4 + Zod + `@asteasolutions/zod-to-openapi`.

**Spec:** `docs/design/E21-S03-commission-console.md` (design direction, cross-model reviewed) and `~/.claude/plans/validated-frolicking-mochi.md` §6, §7.2. Contract for prior interfaces: `docs/stories/E21-S02-interface-notes.md`.

## Global Constraints

- **Visual contract:** `admin-web/DESIGN.md` governs. No new colour, type, radius or spacing tokens. Dark is default; light is opt-in via `html.light`. Radii only 2/4/6/999px. Focus rings use `--color-focus-ring`, never marigold. No nested cards, no gradients, no serif, no all-caps eyebrow labels.
- **Money:** every amount is integer paise on the wire. Render only via `formatINR(paise, locale)` from `@/lib/format/intl`. Never do float arithmetic on rupees. Never display a sum of `cashCollectedPaise` and `creditAppliedPaise`.
- **Read-path tolerance:** treat every optional field in an API response as genuinely absent-able (`oldestDueAt`, `override`, `serviceName`, `slotDate`, `collectionMethod`). Never tighten a response type.
- **i18n:** `hi` is the DEFAULT locale. Every string lands in BOTH `messages/en.json` and `messages/hi.json` under a new top-level `commissions` key. The i18n tests assert both files have identical key sets.
- **Tests live in `admin-web/tests/`**, not colocated. New component tests go under `tests/components/commissions/`.
- **Coverage floor** (`vitest.config.ts`): lines/statements 50%, functions 60%, branches 75%. Do not lower.
- **Hold state is an eligibility filter, never a ranking input.** Never sort, rank or order any list by hold state.
- **Commit after every task.** Test file committed before implementation.

---

## File Structure

**API (Task 1 only)**
- Create `api/src/functions/admin/config/technician-client.ts` — GET + PUT handler for `system/technician-client-config`.
- Modify `api/src/openapi/registry.ts` — register both paths.
- Create `api/tests/functions/admin/config/technician-client.test.ts`.

**admin-web data layer**
- Create `src/api/commissions.ts` — every commission call, on the typed client.
- Create `src/lib/commissions/derive.ts` — pure derivation: balance stack, balance events, hold reason, staleness, threshold impact.
- Create `tests/lib/commissions/derive.test.ts`.

**admin-web shared kit** (first real `src/components/ui/` folder)
- Create `src/components/ui/Dialog.tsx`, `src/components/ui/Drawer.tsx`, `src/components/ui/Toast.tsx`.
- Create `tests/components/ui/{Dialog,Drawer,Toast}.test.tsx`.

**admin-web screens**
- Create `app/[locale]/(dashboard)/finance/commissions/page.tsx` + `[technicianId]/page.tsx`.
- Create `app/[locale]/(dashboard)/settings/commission/page.tsx`.
- Create `src/components/commissions/{CommissionsClient,SummaryBand,TechnicianLedgerClient,BalanceStack,BalanceEvents,RemittanceDrawer,HoldOverrideDialog,HoldChip}.tsx`.
- Create `src/components/settings/CommissionSettingsClient.tsx`.

**admin-web wiring**
- Modify `src/admin/capabilities.ts` — two capabilities, nav entries, route guards, `PRIMARY_NAV_HIDDEN`.
- Modify `src/components/orders/OrderSlideOver.tsx` — audit-log deep link.
- Modify `messages/en.json`, `messages/hi.json`.

---

### Task 1: API — technician-client-config admin handler

E21-S02 built `UpdateTechnicianClientConfigBodySchema`, `systemDocsRepo.patchTechnicianClientConfig`, and the `TECHNICIAN_CLIENT_CONFIG_UPDATED` audit action, but no HTTP route. Task 9 cannot ship the feature-flag panel without it.

**Files:**
- Create: `api/src/functions/admin/config/technician-client.ts`
- Modify: `api/src/openapi/registry.ts`
- Test: `api/tests/functions/admin/config/technician-client.test.ts`

**Interfaces:**
- Consumes: `systemDocsRepo.getTechnicianClientConfig()`, `systemDocsRepo.patchTechnicianClientConfig(body, actorId)`, `UpdateTechnicianClientConfigBodySchema`, `TechnicianClientConfigDocSchema`, `DEFAULT_TECHNICIAN_FEATURES` (all from E21-S02).
- Produces: `GET /v1/admin/config/technician-client` → `{ features, minSupportedVersionCode, updatedBy?, updatedAt? }` (defaults applied, never 404). `PUT` same shape, super-admin only, audit `TECHNICIAN_CLIENT_CONFIG_UPDATED`.

- [ ] **Step 1: Read the existing sibling handler for the exact auth/RBAC/audit idiom**

Read `api/src/functions/admin/catalogue/commission-config.ts` end to end. Copy its structure exactly: how it resolves the admin context, how it gates on `super-admin` for PUT, how it calls `auditLog`, how it shapes 400/401/403. Do not invent a new idiom.

- [ ] **Step 2: Write the failing test**

Create `api/tests/functions/admin/config/technician-client.test.ts`, mirroring the mock setup in `api/tests/functions/admin/catalogue/commission-config.test.ts`:

```ts
it('GET returns defaults when the doc has no features set', async () => {
  vi.mocked(systemDocsRepo.getTechnicianClientConfig).mockResolvedValue({ id: 'technician-client-config' });
  const res = await getTechnicianClientConfigHandler(req({ role: 'finance' }), ctx());
  expect(res.status).toBe(200);
  expect(res.jsonBody).toMatchObject({
    features: { wallet: false, duesBanner: false, upiQr: false, incentives: false, addOnRequests: false },
    minSupportedVersionCode: 0,
  });
});

it('PUT rejects a non-super-admin', async () => {
  const res = await putTechnicianClientConfigHandler(req({ role: 'finance', body: { features: { wallet: true } } }), ctx());
  expect(res.status).toBe(403);
  expect(systemDocsRepo.patchTechnicianClientConfig).not.toHaveBeenCalled();
});

it('PUT rejects an empty patch', async () => {
  const res = await putTechnicianClientConfigHandler(req({ role: 'super-admin', body: {} }), ctx());
  expect(res.status).toBe(400);
});

it('PUT patches and audits', async () => {
  vi.mocked(systemDocsRepo.patchTechnicianClientConfig).mockResolvedValue({
    id: 'technician-client-config', features: { wallet: true }, minSupportedVersionCode: 0,
  });
  const res = await putTechnicianClientConfigHandler(req({ role: 'super-admin', body: { features: { wallet: true } } }), ctx());
  expect(res.status).toBe(200);
  expect(auditLog).toHaveBeenCalledWith(expect.anything(), 'TECHNICIAN_CLIENT_CONFIG_UPDATED', expect.anything(), expect.anything());
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `cd api && npx vitest run tests/functions/admin/config/technician-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Commit the failing test**

```bash
git add api/tests/functions/admin/config/technician-client.test.ts
git commit -m "test(api): specify the admin technician-client-config route"
```

- [ ] **Step 5: Implement the handler**

Create `api/src/functions/admin/config/technician-client.ts`. GET is allowed for `super-admin` and `finance` (it is read-only config); PUT is `super-admin` only. GET must apply `DEFAULT_TECHNICIAN_FEATURES` for any unset flag and default `minSupportedVersionCode` to `0`, so the client never has to reason about absence. Register both with `app.http(...)` following the sibling file's registration block.

- [ ] **Step 6: Register both paths in the OpenAPI registry**

In `api/src/openapi/registry.ts`, add two `registry.registerPath({...})` blocks modelled exactly on the `getAdminCommissionConfig` / `putAdminCommissionConfig` pair at lines ~596–620. Response schema: `TechnicianClientConfigDocSchema` (already exported). Request body: `UpdateTechnicianClientConfigBodySchema`. Also `registry.register('TechnicianClientConfigDoc', ...)` so the generated client gets a named type.

- [ ] **Step 7: Run tests and rebuild the OpenAPI document**

Run: `cd api && npx vitest run tests/functions/admin/config/technician-client.test.ts && pnpm run openapi:build && pnpm run openapi:lint`
Expected: PASS, and `api/openapi.json` gains the two paths. Commit `api/openapi.json` — this is an intentional change, unlike the incidental rewrite the full suite causes.

- [ ] **Step 8: Full API smoke gate and commit**

```bash
bash tools/pre-codex-smoke-api.sh
git add api/src api/openapi.json api/tests
git commit -m "feat(api): admin GET/PUT for technician client config"
```

---

### Task 2: admin-web typed data layer

**Files:**
- Modify: `admin-web/src/api/generated/openapi.json`, `admin-web/src/api/generated/schema.d.ts` (regenerated)
- Create: `admin-web/src/api/commissions.ts`
- Test: `admin-web/tests/api/commissions.test.ts`

**Interfaces:**
- Consumes: `createApiClient`, `ApiError` from `@/api/client`; `BROWSER_API_BASE_URL` from `@/api/base`.
- Produces:
  - `fetchCommissionDashboard(continuationToken?): Promise<CommissionDashboard>`
  - `fetchTechnicianLedger(technicianId): Promise<CommissionLedgerDetail>`
  - `recordRemittance(body: RecordRemittanceParams): Promise<RecordRemittanceResponse>`
  - `recomputeAllHolds(): Promise<void>`
  - `setHoldOverride(technicianId, { until, reason }): Promise<void>` / `clearHoldOverride(technicianId): Promise<void>`
  - `fetchCommissionConfig()` / `updateCommissionConfig(patch)`
  - `fetchTechnicianClientConfig()` / `updateTechnicianClientConfig(patch)`
  - Re-exported types from the generated schema: `CommissionDashboard`, `CommissionDashboardRow`, `CommissionLedgerDetail`, `RecordRemittanceResponse`.

- [ ] **Step 1: Regenerate the typed client against the API built in Task 1**

Run: `cd admin-web && pnpm run openapi:client`
Confirm `src/api/generated/schema.d.ts` now contains `/v1/admin/config/technician-client` and `CommissionReceivablesDashboardV2`.

- [ ] **Step 2: Write the failing test**

Create `admin-web/tests/api/commissions.test.ts`. Mock `@/api/client`'s `createApiClient` to return a stub with `GET`/`POST`/`PUT` spies, as `tests/api/complaints.test.ts` does. Assert:

```ts
it('fetchCommissionDashboard passes the continuation token as a query param', async () => {
  GET.mockResolvedValue({ data: { technicians: [], totalOutstanding: 0, unreconciledTechnicianCount: 0 } });
  await fetchCommissionDashboard('dG9rZW4=');
  expect(GET).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables', {
    params: { query: { continuationToken: 'dG9rZW4=' } },
  });
});

it('fetchCommissionDashboard omits the query entirely when there is no token', async () => {
  GET.mockResolvedValue({ data: { technicians: [], totalOutstanding: 0, unreconciledTechnicianCount: 0 } });
  await fetchCommissionDashboard();
  expect(GET).toHaveBeenCalledWith('/v1/admin/finance/commission-receivables', { params: { query: {} } });
});

it('recordRemittance surfaces a 409 as a typed ApiError rather than swallowing it', async () => {
  POST.mockResolvedValue({ error: { code: 'IDEMPOTENCY_MISMATCH' }, response: { status: 409 } });
  await expect(recordRemittance({ technicianId: 't1', amountPaise: 100, method: 'UPI', ref: 'r', idempotencyKey: 'k' }))
    .rejects.toMatchObject({ status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } });
});
```

- [ ] **Step 2b: Run it, confirm it fails, commit the test**

Run: `cd admin-web && npx vitest run tests/api/commissions.test.ts` → FAIL (module not found). Then commit the test file alone.

- [ ] **Step 3: Implement `src/api/commissions.ts`**

Follow `src/api/complaints.ts` exactly: module-level lazy `getBrowserClient()` singleton via `createApiClient({ baseUrl: BROWSER_API_BASE_URL, credentials: 'include' })`, one exported async function per endpoint, each checking `{ data, error }` and throwing `ApiError` on `error`. `recordRemittance` generates nothing itself — the caller supplies `idempotencyKey` (see Task 8), because a key generated inside the fetch helper would change on every retry and defeat idempotency.

- [ ] **Step 4: Run tests, then commit**

```bash
cd admin-web && npx vitest run tests/api/commissions.test.ts
git add admin-web/src/api admin-web/tests/api/commissions.test.ts
git commit -m "feat(admin-web): typed commission API module"
```

---

### Task 3: RBAC — capabilities, nav, route guards

**Files:**
- Modify: `admin-web/src/admin/capabilities.ts`
- Test: `admin-web/tests/admin/capabilities.test.ts` (extend existing)

**Interfaces:**
- Produces: capabilities `'finance.settleCommission'` and `'settings.manage'`; nav entry `Commissions → /finance/commissions`; route guards for `/finance/commissions` and `/settings/commission`; `PRIMARY_NAV_HIDDEN` no longer contains `/audit-log`.

**Scope note:** the spec also lists `orders.revealContact`. That capability guards a route which does not exist until E09-S08. Adding it here would create a capability with no route, which the guard-coverage test in Step 2 would flag. It is deliberately deferred to E09-S08.

- [ ] **Step 1: Write the failing tests**

```ts
it('finance can settle commissions but cannot manage settings', () => {
  expect(hasCapability('finance', 'finance.settleCommission')).toBe(true);
  expect(hasCapability('finance', 'settings.manage')).toBe(false);
});

it('ops-manager can read finance but cannot settle commissions', () => {
  expect(hasCapability('ops-manager', 'finance.settleCommission')).toBe(false);
});

it('super-admin can manage settings', () => {
  expect(hasCapability('super-admin', 'settings.manage')).toBe(true);
});

it('every capability in the union is granted to at least one role', () => {
  for (const cap of ALL_CAPABILITIES) {
    expect(ADMIN_ROLES.some((r) => hasCapability(r, cap))).toBe(true);
  }
});

it('every guarded route maps to a capability that exists', () => {
  for (const { capability } of ADMIN_ROUTE_CAPABILITIES) {
    if (capability !== null) expect(ALL_CAPABILITIES).toContain(capability);
  }
});

it('audit log is reachable from the primary rail again', () => {
  expect(PRIMARY_NAV_HIDDEN.has('/audit-log')).toBe(false);
  expect(navItemsForRole('super-admin').map((i) => i.href)).toContain('/audit-log');
});

it('commission routes are guarded', () => {
  expect(canAccessAdminPath('finance', '/finance/commissions')).toBe(true);
  expect(canAccessAdminPath('support-agent', '/finance/commissions')).toBe(false);
  expect(canAccessAdminPath('finance', '/settings/commission')).toBe(false);
  expect(canAccessAdminPath('super-admin', '/settings/commission')).toBe(true);
});
```

- [ ] **Step 2: Run, confirm failure, commit the test**

Run: `cd admin-web && npx vitest run tests/admin/capabilities.test.ts` → FAIL.

- [ ] **Step 3: Implement**

Add both literals to the `Capability` union and `ALL_CAPABILITIES`. Grant `finance.settleCommission` to `super-admin` (via `ALL_CAPABILITIES`) and to `finance`; grant `settings.manage` to `super-admin` only. Add to `ADMIN_NAV_ITEMS`:

```ts
{ label: 'Commissions', href: '/finance/commissions', icon: 'receipt-indian-rupee', capability: 'finance.settleCommission' },
{ label: 'Settings',    href: '/settings/commission', icon: 'sliders-horizontal',   capability: 'settings.manage' },
```

Add matching entries to `ADMIN_ROUTE_CAPABILITIES`. **Order matters** — `capabilityForPath` matches by prefix, so `/finance/commissions` must be listed BEFORE `/finance`, or the more general prefix wins and `finance.read` would wrongly authorize it. Add a test asserting exactly that ordering consequence. Finally empty `PRIMARY_NAV_HIDDEN` to `new Set<string>()`, keeping the export and its doc comment (E09-S08 and later stories may repopulate it).

- [ ] **Step 4: Run tests and commit**

---

### Task 4: Shared UI kit — Dialog, Drawer, Toast

Four components currently hand-roll the same `react-focus-lock` recipe. This task extracts it once. Per the spec, use the new kit in new screens only — do not refactor `ConfirmModal`, `OrderSlideOver`, `ApproveAllModal` or `ComplaintSlideOver` in this story.

**Files:**
- Create: `admin-web/src/components/ui/Dialog.tsx`, `Drawer.tsx`, `Toast.tsx`
- Test: `admin-web/tests/components/ui/Dialog.test.tsx`, `Drawer.test.tsx`, `Toast.test.tsx`
- Create: `admin-web/src/components/ui/Dialog.stories.tsx`, `Drawer.stories.tsx`

**Interfaces:**
- Produces:
  - `<Dialog open, onClose, titleId?, title, children, footer? />`
  - `<Drawer open, onClose, title, children, footer?, side?: 'right' />`
  - `<ToastRegion toast, onDismiss />` plus `useToast(): { toast, show(message, tone), dismiss() }` where `tone: 'success' | 'error'`.

- [ ] **Step 1: Write the failing tests**

The existing Playwright a11y specs assert the dialog contract, so the unit tests must lock the same shape:

```tsx
it('renders role=dialog with aria-modal and an accessible name', () => {
  render(<Dialog open onClose={noop} title="Record payment">body</Dialog>);
  const d = screen.getByRole('dialog');
  expect(d).toHaveAttribute('aria-modal', 'true');
  expect(d).toHaveAccessibleName('Record payment');
});

it('closes on Escape', async () => {
  const onClose = vi.fn();
  render(<Dialog open onClose={onClose} title="T">body</Dialog>);
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});

it('does not close on Escape when a nested dialog is open above it', async () => {
  // Mirrors the existing ConfirmModal-inside-OrderSlideOver guard: a dialog only
  // handles Escape when it is the last [role="dialog"] in the document.
  const onClose = vi.fn();
  render(<><Dialog open onClose={onClose} title="Outer">a</Dialog><Dialog open onClose={noop} title="Inner">b</Dialog></>);
  await userEvent.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
});

it('renders nothing when closed', () => {
  render(<Dialog open={false} onClose={noop} title="T">body</Dialog>);
  expect(screen.queryByRole('dialog')).toBeNull();
});
```

`Toast.test.tsx` asserts `role="status"` for success and `role="alert"` for error — an error must interrupt a screen reader, a success must not.

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement the three components**

Wrap content in `<FocusLock returnFocus>` from `react-focus-lock`. Root element carries `role="dialog" aria-modal="true" aria-labelledby={id}` with `id` from `useId()`. Escape handling in a `useEffect` that first checks `document.querySelectorAll('[role="dialog"]')` and only acts if this element is the last one. Backdrop is a sibling `<div aria-hidden="true" onClick={onClose}>`. Style strictly with existing tokens: surface `--color-surface-raised`, border `--color-border`, radius `--radius-lg`, transition `220ms` guarded by `@media (prefers-reduced-motion: reduce)`. `Drawer` is the same contract with a right-edge slide.

- [ ] **Step 4: Add Storybook stories**

Both stories must wrap in `<NextIntlClientProvider locale="en" messages={...}>` — see the inline note in `CounterStrip.stories.tsx`.

- [ ] **Step 5: Run tests and commit**

---

### Task 5: Pure derivation library

All arithmetic the screens display lives here, as pure functions with no React and no fetch. This is where the design doc's load-bearing rules become executable.

**Files:**
- Create: `admin-web/src/lib/commissions/derive.ts`
- Test: `admin-web/tests/lib/commissions/derive.test.ts`

**Interfaces:**
- Produces:
  - `buildBalanceStack(detail: CommissionLedgerDetail): { commissionDuePaise, repaidPaise, creditedPaise, balancePaise }`
  - `buildBalanceEvents(detail: CommissionLedgerDetail): BalanceEvent[]` where `BalanceEvent = { id, at, kind: 'DUE'|'REMITTANCE'|'CREDIT'|'WAIVER', label, bookingId?, ref?, actorId?, changePaise, balancePaise }`
  - `holdReason(hold, thresholds, locale): string`
  - `isStale(row: { staleAfter: string }, now: Date): boolean`
  - `thresholdImpact(rows, blockThresholdPaise): { blockedCount, sample: string[] }`

- [ ] **Step 1: Write the failing tests**

```ts
const detail = {
  technicianId: 't1', hold: null,
  receivables: [
    { id: 'b1', bookingId: 'b1', commissionDue: 13478, remittedAmount: 0, remittanceStatus: 'DUE', createdAt: '2026-05-08T04:57:40.119Z', outstandingPaise: 13478, serviceName: 'AC Deep Clean' },
    { id: 'b2', bookingId: 'b2', commissionDue: 13478, remittedAmount: 13478, remittanceStatus: 'REMITTED', createdAt: '2026-05-09T03:26:15.061Z', outstandingPaise: 0, serviceName: 'AC Deep Clean' },
  ],
  remittances: [{ id: 'rem:k1', amountPaise: 13478, method: 'UPI', ref: 'upi-1', allocations: [{ bookingId: 'b2', paise: 13478 }], creditCreatedPaise: 0, recordedByAdminId: 'admin-1', createdAt: '2026-09-02T10:00:00.000Z' }],
  credits: [], cashCollectedPaise: 619300, creditAppliedPaise: 0,
};

it('balance stack states commission due, what was repaid, what was credited, and the balance', () => {
  expect(buildBalanceStack(detail)).toEqual({
    commissionDuePaise: 26956, repaidPaise: 13478, creditedPaise: 0, balancePaise: 13478,
  });
});

it('balance stack never includes cashCollectedPaise in any line', () => {
  const stack = buildBalanceStack(detail);
  expect(Object.values(stack)).not.toContain(detail.cashCollectedPaise);
  // Cash is evidence for why commission exists, not a balance line. Guarding this
  // in a test because it is the single easiest mistake to make on this screen.
  expect(stack.balancePaise).toBe(stack.commissionDuePaise - stack.repaidPaise - stack.creditedPaise);
});

it('balance events run chronologically with a correct running balance', () => {
  const events = buildBalanceEvents(detail);
  expect(events.map((e) => [e.kind, e.changePaise, e.balancePaise])).toEqual([
    ['DUE', 13478, 13478],
    ['DUE', 13478, 26956],
    ['REMITTANCE', -13478, 13478],
  ]);
});

it('balance events carry the booking id and the reference for a dispute call', () => {
  const events = buildBalanceEvents(detail);
  expect(events[0]).toMatchObject({ bookingId: 'b1' });
  expect(events[2]).toMatchObject({ ref: 'upi-1', actorId: 'admin-1' });
});

it('holdReason explains a BLOCKED state in money terms', () => {
  const reason = holdReason({ state: 'BLOCKED', outstandingPaise: 524000, dueCount: 3, evaluatedAt: 'x' }, { warnPaise: 250000, blockPaise: 500000 }, 'en');
  expect(reason).toContain('₹5,240.00');
  expect(reason).toContain('₹5,000.00');
});

it('isStale is true only past staleAfter', () => {
  expect(isStale({ staleAfter: '2026-09-07T12:00:00.000Z' }, new Date('2026-09-07T11:59:00.000Z'))).toBe(false);
  expect(isStale({ staleAfter: '2026-09-07T12:00:00.000Z' }, new Date('2026-09-07T12:01:00.000Z'))).toBe(true);
});

it('thresholdImpact counts who would be blocked at a candidate threshold', () => {
  const rows = [{ technicianName: 'Ramesh', outstandingPaise: 139346 }, { technicianName: 'Suresh', outstandingPaise: 20206 }];
  expect(thresholdImpact(rows, 500000)).toEqual({ blockedCount: 0, sample: [] });
  expect(thresholdImpact(rows, 100000)).toEqual({ blockedCount: 1, sample: ['Ramesh'] });
});
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement `derive.ts`**

Pure functions only. `buildBalanceEvents` merges receivables (as positive DUE events at `createdAt`), remittances (negative at `createdAt`), and credits (negative when applied), sorts by timestamp ascending, then accumulates. All arithmetic in integer paise. `holdReason` formats via `formatINR`. Every function must tolerate the optional fields being absent.

- [ ] **Step 4: Run tests and commit**

---

### Task 6: Roll-up screen — `/finance/commissions`

**Files:**
- Create: `admin-web/app/[locale]/(dashboard)/finance/commissions/page.tsx`
- Create: `admin-web/src/components/commissions/CommissionsClient.tsx`, `SummaryBand.tsx`, `HoldChip.tsx`
- Test: `admin-web/tests/components/commissions/{CommissionsClient,SummaryBand,HoldChip}.test.tsx`

**Interfaces:**
- Consumes: `fetchCommissionDashboard`, `recomputeAllHolds` (Task 2); `isStale`, `thresholdImpact` (Task 5); `HoldChip`.
- Produces: `<HoldChip state, override? />` reused by Task 7.

- [ ] **Step 1: Write the failing tests**

```tsx
it('labels the total "Outstanding commission" when everything is reconciled', () => {
  render(<SummaryBand totalOutstanding={184258} technicianCount={4} unreconciledTechnicianCount={0} oldestDueAt="2026-05-08T00:00:00Z" onRecompute={noop} canRecompute />);
  expect(screen.getByText(/Outstanding commission/)).toBeInTheDocument();
  expect(screen.getByText('₹1,842.58')).toBeInTheDocument();
});

it('relabels the total "Cached total" and warns when balances are unreconciled', () => {
  render(<SummaryBand totalOutstanding={184258} technicianCount={4} unreconciledTechnicianCount={3} onRecompute={noop} canRecompute />);
  expect(screen.getByText(/Cached total/)).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/3 technicians have unreconciled balances/);
});

it('renders no badge for a CLEAR hold', () => {
  const { container } = render(<HoldChip state="CLEAR" />);
  expect(container).toHaveTextContent('—');
});

it('names the actor and date on an override', () => {
  render(<HoldChip state="CLEAR" override={{ until: '2026-09-30T00:00:00Z', byAdminId: 'Alok', reason: 'r' }} />);
  expect(screen.getByText(/Override/)).toBeInTheDocument();
  expect(screen.getByText(/Alok/)).toBeInTheDocument();
});

it('orders rows by outstanding amount and never by hold state', () => {
  render(<CommissionsClient initialData={{ technicians: [
    { technicianId: 'a', technicianName: 'Low Blocked',  outstandingPaise: 100,   dueCount: 1, state: 'BLOCKED', evaluatedAt: NOW, staleAfter: LATER },
    { technicianId: 'b', technicianName: 'High Clear',   outstandingPaise: 90000, dueCount: 2, state: 'CLEAR',   evaluatedAt: NOW, staleAfter: LATER },
  ], totalOutstanding: 90100, unreconciledTechnicianCount: 0 }} />);
  const names = screen.getAllByTestId('commission-row-name').map((n) => n.textContent);
  expect(names).toEqual(['Low Blocked', 'High Clear']); // server order preserved, not re-sorted by state
});

it('marks a row stale once past staleAfter', () => { /* row with staleAfter in the past shows the stale marker */ });

it('hides Recompute from a role without settle capability', () => { /* canRecompute=false → no button */ });
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement**

`page.tsx` is a thin server component: `export const dynamic = 'force-dynamic'`, a `generateMetadata` using `getTranslations('commissions')`, rendering `<CommissionsClient />`. All state lives in the client component, following `FinanceClient.tsx`.

`SummaryBand` is a band, not a card — a single hairline rule beneath it, no border box, no nesting. Table follows the house style: `divide-y divide-[var(--color-border)]`, header `bg-[var(--color-surface-alt)]` with `text-[var(--color-text-muted)]`, row hover `hover:bg-[var(--color-surface-alt)]`, money right-aligned in `--font-mono`. Wrap the table in `<div className="overflow-x-auto">` so the page never scrolls sideways. Empty state uses the shared `EmptyState` component. Pagination uses the `continuationStack` idiom from `AuditLogClient.tsx`.

Each row links to `/finance/commissions/[technicianId]`. Gate the Recompute button on `hasCapability(auth?.role, 'finance.settleCommission')`.

- [ ] **Step 4: Run tests and commit**

---

### Task 7: Detail screen — `/finance/commissions/[technicianId]`

**Files:**
- Create: `admin-web/app/[locale]/(dashboard)/finance/commissions/[technicianId]/page.tsx`
- Create: `admin-web/src/components/commissions/TechnicianLedgerClient.tsx`, `BalanceStack.tsx`, `BalanceEvents.tsx`, `HoldOverrideDialog.tsx`
- Test: `admin-web/tests/components/commissions/{BalanceStack,BalanceEvents,TechnicianLedgerClient}.test.tsx`

**Interfaces:**
- Consumes: `fetchTechnicianLedger`, `setHoldOverride`, `clearHoldOverride` (Task 2); `buildBalanceStack`, `buildBalanceEvents`, `holdReason` (Task 5); `Dialog` (Task 4); `HoldChip` (Task 6).

- [ ] **Step 1: Write the failing tests**

```tsx
it('shows the accounting stack with signed lines and a stated balance', () => {
  render(<BalanceStack stack={{ commissionDuePaise: 26956, repaidPaise: 13478, creditedPaise: 0, balancePaise: 13478 }} cashCollectedPaise={619300} jobCount={11} />);
  expect(screen.getByText('₹269.56')).toBeInTheDocument();
  expect(screen.getByText('− ₹134.78')).toBeInTheDocument();
  expect(screen.getByText('₹134.78')).toBeInTheDocument();
});

it('states plainly that cash collected is not part of the balance', () => {
  render(<BalanceStack stack={{ commissionDuePaise: 26956, repaidPaise: 0, creditedPaise: 0, balancePaise: 26956 }} cashCollectedPaise={619300} jobCount={11} />);
  const cash = screen.getByTestId('cash-context');
  expect(cash).toHaveTextContent('₹6,193.00');
  expect(cash).toHaveTextContent(/not part of the balance/i);
});

it('renders cash context outside the balance region so the two are not one group', () => {
  render(<BalanceStack ... />);
  const balance = screen.getByTestId('balance-stack');
  expect(balance).not.toContainElement(screen.getByTestId('cash-context'));
});

it('balance events show a running balance with copyable references', async () => {
  render(<BalanceEvents events={[{ id: 'e1', at: '2026-09-02T10:00:00Z', kind: 'REMITTANCE', label: 'Payment', ref: 'upi-1', actorId: 'Alok', changePaise: -13478, balancePaise: 13478 }]} />);
  expect(screen.getByText('upi-1')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /copy reference/i }));
  expect(await navigator.clipboard.readText()).toBe('upi-1');
});

it('explains why a technician is blocked in money terms', () => { /* holdReason surfaced verbatim */ });
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement**

`BalanceStack` renders the stack as a definition list with a rule above the total, and the cash-context block as a **sibling section outside** the balance element — the test above enforces that separation structurally, because it is the story's load-bearing invariant. Never render a figure combining cash and credit.

`BalanceEvents` renders the chronological table with a copy-to-clipboard button per reference (`navigator.clipboard.writeText`, with a `document.execCommand` fallback guarded by a feature check). `HoldOverrideDialog` uses the Task 4 `Dialog`, takes `until` (date input) and `reason` (required, non-empty), and gates on `settings.manage`.

Below the stack: the receivables table with a "technician-declared" marker on rows whose `collectionMethod === 'UPI_QR'`, then `RemittanceHistory` and `CreditsList` as separate sections.

- [ ] **Step 4: Run tests and commit**

---

### Task 8: Remittance drawer

**Files:**
- Create: `admin-web/src/components/commissions/RemittanceDrawer.tsx`
- Test: `admin-web/tests/components/commissions/RemittanceDrawer.test.tsx`

**Interfaces:**
- Consumes: `recordRemittance` (Task 2), `Drawer` + `useToast` (Task 4), `buildBalanceStack` (Task 5).

- [ ] **Step 1: Write the failing tests**

```tsx
it('labels the allocation as a preview the server will recalculate', () => {
  render(<RemittanceDrawer open technicianId="t1" receivables={dueRows} onClose={noop} onRecorded={noop} />);
  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });
  expect(screen.getByTestId('allocation-preview')).toHaveTextContent(/server recalculates/i);
});

it('allocates the preview oldest-due first', () => { /* 2 rows, ₹200 covers the older then part of the newer */ });

it('generates one idempotency key per attempt and reuses it across retries of that attempt', async () => {
  // A new key per retry would defeat idempotency and risk double-charging.
  recordRemittance.mockRejectedValueOnce(Object.assign(new Error('net'), { status: 503 }));
  recordRemittance.mockResolvedValueOnce(okResponse);
  render(<RemittanceDrawer open ... />);
  await submit(); await submit();
  const [first, second] = recordRemittance.mock.calls;
  expect(first[0].idempotencyKey).toBe(second[0].idempotencyKey);
});

it('starts a fresh idempotency key after a successful record', async () => { /* key differs on the next distinct payment */ });

it('reports a replayed receipt as the original, not a second payment', async () => {
  recordRemittance.mockResolvedValue({ ...okResponse, replayed: true });
  await submit();
  expect(await screen.findByRole('status')).toHaveTextContent(/original receipt, not a second payment/i);
});

it('says the balance will catch up when the hold recompute is pending', async () => {
  recordRemittance.mockResolvedValue({ ...okResponse, hold: null, holdRecomputePending: true });
  await submit();
  expect(await screen.findByRole('status')).toHaveTextContent(/catch up shortly/i);
});

it('explains an idempotency mismatch as a reference-reuse problem', async () => {
  recordRemittance.mockRejectedValue(Object.assign(new Error(), { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } }));
  await submit();
  expect(await screen.findByRole('alert')).toHaveTextContent(/already used for a different amount/i);
});

it('tells the operator when the server allocated differently than previewed', async () => {
  recordRemittance.mockResolvedValue({ ...okResponse, allocations: [{ bookingId: 'b1', paise: 20000 }] }); // preview had 2 rows
  await submit();
  expect(await screen.findByRole('status')).toHaveTextContent(/Allocated differently than previewed/i);
});
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement**

Amount input is in rupees for the operator and converted with `rupeesToPaise` from `@/lib/format/intl` at the boundary — never parse rupees by hand. `idempotencyKey` is generated once with `crypto.randomUUID()` when the drawer opens and held in a ref; it resets only after a successful record. The preview is computed locally oldest-due-first purely for display and is rendered behind a dashed left rule in `--color-text-faint` under the preview label. On success, compare returned `allocations` against the preview and, when they differ, render the delta message before the drawer closes. Button label **Record payment**; success toast **Payment recorded**.

- [ ] **Step 4: Run tests and commit**

---

### Task 9: Settings — `/settings/commission`

**Files:**
- Create: `admin-web/app/[locale]/(dashboard)/settings/commission/page.tsx`
- Create: `admin-web/src/components/settings/CommissionSettingsClient.tsx`
- Test: `admin-web/tests/components/settings/CommissionSettingsClient.test.tsx`

**Interfaces:**
- Consumes: `fetchCommissionConfig`, `updateCommissionConfig`, `fetchTechnicianClientConfig`, `updateTechnicianClientConfig` (Task 2); `thresholdImpact` (Task 5); `Dialog` (Task 4).

- [ ] **Step 1: Write the failing tests**

```tsx
it('warns that a rate change does not reprice past bookings', () => {
  render(<CommissionSettingsClient ... />);
  expect(screen.getByText(/Past bookings keep the rate they were priced at/i)).toBeInTheDocument();
});

it('rejects warn >= block before calling the API', async () => {
  await setThresholds({ warn: '5000', block: '5000' });
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(updateCommissionConfig).not.toHaveBeenCalled();
  expect(await screen.findByRole('alert')).toHaveTextContent(/warn.*below.*block/i);
});

it('shows how many technicians a candidate block threshold would affect', async () => {
  render(<CommissionSettingsClient rows={[{ technicianName: 'Ramesh', outstandingPaise: 139346 }]} ... />);
  await setThresholds({ block: '1000' });
  expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/1 technician/);
  expect(screen.getByTestId('threshold-impact')).toHaveTextContent(/Ramesh/);
});

it('requires confirmation before enabling hold enforcement', async () => {
  await userEvent.click(screen.getByLabelText(/block technicians who owe too much/i));
  expect(updateCommissionConfig).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toHaveTextContent(/stop receiving work/i);
});

it('shows who last changed the config and when', () => { /* updatedBy + updatedAt rendered */ });

it('hides everything from a role without settings.manage', () => { /* renders a not-authorized state */ });
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement**

Two sections separated by a rule: **Rates** (global bps, per-category table) and **Enforcement** (thresholds, `holdEnforcementEnabled`, `enforceKycInDispatch`), then a third for **Technician app features** (the five flags from Task 1). Validate `warn < block` client-side before submitting — the API also enforces it with `400 THRESHOLD_ORDER`, and both messages must say the same thing. Threshold impact is computed from dashboard rows already in memory via `thresholdImpact`; when no rows are loaded, render nothing rather than a misleading zero.

- [ ] **Step 4: Run tests and commit**

---

### Task 10: Audit-log deep links and roster cleanup

**Files:**
- Modify: `admin-web/src/components/orders/OrderSlideOver.tsx`
- Modify: the technician roster component (find via `rg "commissionPct" admin-web/src`)
- Test: extend the existing tests for both

**Interfaces:**
- Consumes: `HoldChip` (Task 6).

- [ ] **Step 1: Write the failing tests**

```tsx
it('links an order to its audit trail', () => {
  render(<OrderSlideOver order={{ id: 'bk-1', ... }} ... />);
  expect(screen.getByRole('link', { name: /audit/i }))
    .toHaveAttribute('href', expect.stringContaining('/audit-log?resourceType=booking&resourceId=bk-1'));
});

it('no longer offers an editable commission percentage on the roster', () => {
  render(<TechnicianRoster ... />);
  expect(screen.queryByLabelText(/commission %/i)).toBeNull();
});

it('shows a roster technician’s hold state and outstanding balance', () => { /* HoldChip + formatINR */ });
```

- [ ] **Step 2: Run, confirm failure, commit the tests**

- [ ] **Step 3: Implement**

Remove the editable `commissionPct` control and any handler that writes it — the roster field is dead config superseded by per-service `commissionBps` (spec §10). Do not delete the stored field from the API. Add the hold badge and outstanding balance, and the audit deep link. Also hide the Payout Queue when the finance summary reports `payoutsEnabled: false`.

- [ ] **Step 4: Run tests and commit**

---

### Task 11: i18n, a11y, Storybook, and the gate

**Files:**
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json`
- Create: `admin-web/tests/i18n/commissions.i18n.test.tsx`
- Create: `admin-web/tests/a11y/commissions.a11y.spec.ts`
- Create: `admin-web/tests/e2e/commissions.spec.ts`
- Modify: `admin-web/tests/e2e/mock-admin-api.mjs`
- Create: `admin-web/src/components/commissions/SummaryBand.stories.tsx`, `BalanceStack.stories.tsx`

- [ ] **Step 1: Add the `commissions` namespace to both message files**

One new top-level `commissions` key in each of `messages/en.json` and `messages/hi.json`, with identical key sets. Hindi is the default locale and must be written as first-class copy, not a machine gloss — in particular the balance-stack line labels and the "not part of the balance" clarifier, which is the sentence that prevents an owner-facing money misreading.

- [ ] **Step 2: Write the i18n parity test**

Mirror an existing `tests/i18n/*.i18n.test.tsx`: assert `Object.keys` of the `commissions` namespace match exactly between `en` and `hi`, recursively.

- [ ] **Step 3: Write the a11y spec**

Model on `tests/a11y/finance.a11y.spec.ts`: sign in via `makeAccessJwt`, visit `/en/finance/commissions` and the detail route, run `AxeBuilder().withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])`, filter to `critical`/`serious`, expect `[]`. Add a second test that opens the remittance drawer, Tabs through it asserting focus stays within `[role="dialog"]`, and presses Escape to close.

- [ ] **Step 4: Extend the mock API and write the settle e2e**

Add the commission routes to `tests/e2e/mock-admin-api.mjs`, then an e2e that records a payment end to end and asserts the success toast and the updated balance.

- [ ] **Step 5: Storybook stories**

`SummaryBand` in both reconciled and unreconciled states; `BalanceStack` with and without credits. Wrap in `NextIntlClientProvider`.

- [ ] **Step 6: Full gate**

```bash
bash tools/pre-codex-smoke-web.sh
```
Expected: exit 0. Then, from the worktree root, run the Codex gate via the `codex-review-gate` skill. Do not write `.codex-review-passed` unless a review actually runs clean.

- [ ] **Step 7: Final commit**

---

## Self-Review

**Spec coverage.** §7.2 routes → Tasks 6, 7, 9. RBAC → Task 3 (with `orders.revealContact` explicitly deferred to E09-S08 and the reason recorded). Shared kit → Task 4. Roster + Payout Queue → Task 10. Audit unhide + deep links → Tasks 3 and 10. Data layer on typed client → Task 2. i18n en+hi → Task 11. Tests/Storybook/a11y/e2e → Task 11. Design direction §4 accounting stack → Tasks 5 and 7. §5 preview and mismatch → Task 8. §6 threshold impact and accountability → Task 9. The one addition beyond §7.2 is Task 1, which §7.2 assumes exists.

**Type consistency.** `CommissionDashboard`/`CommissionDashboardRow`/`CommissionLedgerDetail`/`RecordRemittanceResponse` are produced in Task 2 and consumed under those names in 5–9. `HoldChip` is produced in Task 6 and consumed in 7 and 10. `buildBalanceStack`/`buildBalanceEvents`/`holdReason`/`isStale`/`thresholdImpact` are produced in Task 5 and consumed in 6, 7 and 9 with those exact names. `Dialog`/`Drawer`/`useToast` are produced in Task 4 and consumed in 7, 8 and 9.

**Known risk.** Task 3's route-guard ordering (`/finance/commissions` before `/finance`) is the one place a silent authorization bug could hide, so it carries its own assertion rather than relying on review.

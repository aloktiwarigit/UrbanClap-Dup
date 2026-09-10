# Issue #334 — Service Commission Override Clearable + Roster — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A super-admin can clear a service-level `commissionBps` override back to "inherit category/global," and can see which services carry an override, without touching authorization or the read path.

**Architecture:** Mirror the category-override fix from E21-S03 (PR #327) exactly at every layer — write-body schema, repository merge logic, admin-web API client, and settings-page roster UI. The category path already solved this problem; this plan ports it to services rather than re-deriving it. One net-new decision: whether the roster needs an `includeInactive` fetch path (Decision D1 below).

**Tech Stack:** Zod (API schemas), Cosmos SDK (repository), Vitest (both API and admin-web tests), Next.js + next-intl (admin-web UI).

**Spec:** GitHub issue #334 (https://github.com/aloktiwarigit/UrbanClap-Dup/issues/334). No separate spec doc — the issue body is the spec; quoted in full context below.

## Global Constraints

- **Read-path schemas only widen, never tighten — and the inverse holds too: this fix touches ONLY `UpdateServiceBodySchema` (a write body). `ServiceSchema` (the stored-document/read schema) is not touched anywhere in this plan.** (Project CLAUDE.md, `feedback_read_path_validation`.)
- **`commissionBpsForbidden` must not be weakened.** It authorizes on key *presence* (`'commissionBps' in body`), so clearing stays super-admin-only exactly like setting. Already verified against a real `{ commissionBps: null }` body (see Task 1) — no source change needed, but a regression test is required so this stays true.
- **PATCH semantics:** an absent key means "leave unchanged"; an explicit `null` means "delete this key, revert to inheriting." This is already documented on `UpdateCategoryBodySchema` at `api/src/schemas/service-category.ts:44-58` and on `CatalogueRepository.updateCategory` at `api/src/cosmos/catalogue-repository.ts:64-72` — this plan references those comments, it does not re-explain the rationale.
- **TDD:** test file committed before implementation file, every task.
- **i18n:** new UI copy must exist in both `admin-web/messages/en.json` and `admin-web/messages/hi.json`. Tests assert against the real message files, never a mocked `next-intl` (a mock cannot prove a key exists — `feedback_i18n_mock_blindspot`).
- **`docs/patterns/` check:** none of the 7 files in `docs/patterns/` apply to this fix (all Android/Compose-specific: Firebase callback lifecycle, Firebase error codes, Hilt DI test scope, Kotlin explicit-API mode, Paparazzi goldens, Compose locale init, Devanagari typography). Confirmed by inspection before writing this plan — not skipped, checked and found not applicable.
- **Smoke gates before Codex:** `bash tools/pre-codex-smoke-api.sh` (after WS-A) and `bash tools/pre-codex-smoke-web.sh` (after WS-B), both before `codex review --base main`.
- **`openapi:client` regen:** admin-web's generated types (`admin-web/src/api/generated/schema.d.ts`) come from `api/src/schemas/*` via `admin-web/package.json`'s `openapi:client` script (`node scripts/openapi-sync.mjs && openapi-typescript ...`). WS-B's `ServiceForm.tsx` and `commissions.ts` changes are typed against `NonNullable<operations['adminUpdateService']['requestBody']>['content']['application/json']` (see `ServiceForm.tsx:14-16`) — this type will not include `commissionBps: number | null` until WS-A's schema change lands AND the regen runs. **Decision: WS-A and WS-B run sequentially, not in parallel**, specifically because of this type dependency — Task 4 (regen) is the hard sync point between them. This is a one-command, low-cost step, so sequencing costs minutes, not hours; running WS-B first against stale types would mean either a wrong type assertion or rework, which costs more.

## Decision D1 — does the roster need inactive services too?

**Open question from the issue:** "Whoever picks this up should decide whether it belongs on the commission settings page or the catalogue list; the E21-S03 ledger did not rule on that."

**Placement: commission settings page** (`admin-web/src/components/settings/CommissionSettingsClient.tsx`), as a new "Service overrides" section alongside the existing "Category overrides" table. This keeps every commission-related surface in one place, matching where an operator already goes to reason about rates, and reuses that page's existing data-loading, i18n namespace (`settings.rates.*`), and table markup verbatim.

**Inactive services: yes, include them, via a new `includeInactive` fetch path scoped narrowly.**

Evidence for the asymmetry that makes this necessary: `CatalogueRepository.listAllCategories()` (`catalogue-repository.ts:38-43`) queries all categories, no `isActive` filter — so the existing category roster already shows overrides on inactive categories. `CatalogueRepository.listAllActiveServices()` (`catalogue-repository.ts:97-101`), which backs the only existing admin service-listing endpoint, filters `WHERE c.isActive = true`. If the new service roster reuses that endpoint unchanged, an override on a service that gets deactivated becomes invisible again — the exact "no roster view lists which services carry one" defect this issue exists to close, just relocated to the inactive-service case instead of removed.

Scope of the addition, kept narrow so it doesn't widen blast radius beyond the roster:
- New repository method `listAllServices()` (no filter, mirrors `listAllCategories()`'s shape exactly — see Task 6).
- New optional query param `includeInactive=true` on the existing `GET /v1/admin/catalogue/services` route (`listAdminServicesHandler`), used ONLY by the roster's fetch call. The default (param absent) is unchanged — still `listAllActiveServices()` — so every other caller of this endpoint (the catalogue list page) behaves exactly as before.

## Work Streams

- **WS-A (Tasks 1-3):** API — schema, repository, guard-safety regression tests. No admin-web changes.
- **Sync point (Task 4):** `openapi:client` regen. Must run after WS-A lands, before WS-B's UI code can compile against real generated types.
- **WS-B (Tasks 5-8):** admin-web — API client, form fix, roster UI, i18n.
- **WS-C (Task 9):** Smoke gates, Codex review, push.

---

## Task 1: Prove the existing guards need no change, with a real `null` body

This task exists to convert "confirmed by reading the code" (done during planning, see the plan's own investigation) into a permanent regression test — the same class of guard-proving this repo's owner has been enforcing all evening (#331/#336/#337): a guard trusted because it looks right is exactly the guard that goes untested.

**Files:**
- Test: `api/tests/catalogue-admin.test.ts` (modify — add to the existing `describe('PUT /v1/admin/catalogue/services/:id')` or equivalent update-service block; if no such block exists yet, add one alongside the category one)

**Interfaces:**
- Consumes: `updateServiceHandler` (existing, `api/src/functions/catalogue-admin.ts:198`), `commissionBpsForbidden` (existing, same file `:87`), `mockAdmin` / `opsManager` fixtures and `makeReq` helper (existing, top of `catalogue-admin.test.ts`).
- Produces: nothing new consumed by later tasks — this is a pure regression-test addition.

- [ ] **Step 1: Read the existing category-update test block for the exact structure to mirror**

Already read during planning — `api/tests/catalogue-admin.test.ts` around lines 180-230 has, in order: `'super-admin can clear a category commission override'`, `'ops-manager clearing commissionBps also gets 403 and the stored document is unchanged'`. Find the equivalent `describe` block for `updateServiceHandler` in the same file (it exists — services and categories are both covered in this file per its imports) and locate where a service-update super-admin test currently sits, so the new tests land next to it.

- [ ] **Step 2: Write the failing tests**

Add these two tests inside the existing `updateServiceHandler` describe block (adjust the mocked service id from `'plumbing'` to whatever fixture id that block already uses for services — check the surrounding tests in the same block and match it):

```typescript
it('super-admin can clear a service commission override', async () => {
  const res = await updateServiceHandler(
    makeReq('http://localhost/...', { commissionBps: null }, { id: 'ac-deep-clean' }, 'PUT'),
    {} as never,
    mockAdmin,
  );
  expect(res.status).toBe(200);
  expect(vi.mocked(catalogueRepo.updateService)).toHaveBeenCalledWith(
    'ac-deep-clean', { commissionBps: null }, 'dev-user',
  );
});

it('ops-manager clearing a service commissionBps also gets 403 and the stored document is unchanged', async () => {
  vi.mocked(catalogueRepo.updateService).mockClear();
  const res = await updateServiceHandler(
    makeReq('http://localhost/...', { commissionBps: null }, { id: 'ac-deep-clean' }, 'PUT'),
    {} as never,
    opsManager,
  );
  expect(res.status).toBe(403);
  expect(res.jsonBody).toMatchObject({ code: 'FORBIDDEN', field: 'commissionBps' });
  expect(vi.mocked(catalogueRepo.updateService)).not.toHaveBeenCalled();
});
```

If the file's mocked `catalogueRepo.updateService` doesn't yet return a resolved value in the `beforeEach`/mock setup for this describe block, check how the sibling `updateCategory` mock is initialized in the same file and mirror it (likely `vi.mocked(catalogueRepo.updateService).mockResolvedValue({...} as Service)` in a `beforeEach`, or per-test as the category tests do).

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd api && npx vitest run tests/catalogue-admin.test.ts -t "commission override"`
Expected: FAIL — `UpdateServiceBodySchema.parse({ commissionBps: null }, ...)` inside `updateServiceHandler` throws a `ZodError` because the schema does not yet accept `null` for this field (that's Task 2's job), so the handler returns 400, not 200/403.

- [ ] **Step 4: Commit the failing tests**

```bash
git add api/tests/catalogue-admin.test.ts
git commit -m "test(api): pin service commissionBps clear + ops-manager 403 (fails until schema widens)"
```

---

## Task 2: Widen `UpdateServiceBodySchema.commissionBps` to nullable

**Files:**
- Modify: `api/src/schemas/service.ts:159-166` (the `UpdateServiceBodySchema` definition)
- Test: `api/tests/catalogue-patch-semantics.test.ts` (modify — add schema-level parse tests mirroring the existing `UpdateCategoryBodySchema` null tests at lines ~142-146)

**Interfaces:**
- Consumes: `CommissionBpsSchema` from `api/src/schemas/commission-config.ts` (already imported by `service-category.ts:4` — import it into `service.ts` too).
- Produces: `UpdateServiceBodySchema` now parses `{ commissionBps: null }` to `{ commissionBps: null }` instead of throwing. `UpdateServiceBody` type (inferred, `service.ts:174`) becomes `{ ..., commissionBps?: number | null, ... }`. This is the type Task 4's regen surfaces to admin-web.

- [ ] **Step 1: Write the failing schema tests**

Add to `api/tests/catalogue-patch-semantics.test.ts`, near the existing `UpdateCategoryBodySchema` null tests (~line 142):

```typescript
// Issue #334: UpdateServiceBodySchema.commissionBps is the service-side mirror of
// UpdateCategoryBodySchema.commissionBps above — same nullable-write-body pattern,
// same reason (PATCH semantics: absent = unchanged, null = clear). The stored
// ServiceSchema is untouched and still rejects null for this field (last assertion
// pins that so a future edit cannot silently widen the READ shape too).
it('UpdateServiceBodySchema accepts a numeric commissionBps (sets an override)', () => {
  expect(UpdateServiceBodySchema.parse({ commissionBps: 2500 })).toEqual({ commissionBps: 2500 });
});

it('UpdateServiceBodySchema accepts an explicit null commissionBps (clears the override)', () => {
  expect(UpdateServiceBodySchema.parse({ commissionBps: null })).toEqual({ commissionBps: null });
});

it('ServiceSchema (the stored/read shape) still rejects null commissionBps', () => {
  expect(() => richService.commissionBps).not.toThrow(); // sanity: richService has a numeric value
  expect(() =>
    ServiceSchema.parse({ ...richService, commissionBps: null }),
  ).toThrow();
});
```

This file already imports `UpdateServiceBodySchema` from `../src/schemas/service.js` (line 18) — add `ServiceSchema` to that same import line since it's not currently imported (check the existing import statement and extend it rather than adding a second import line for the same module).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && npx vitest run tests/catalogue-patch-semantics.test.ts -t "commissionBps"`
Expected: FAIL on the `null` case — `UpdateServiceBodySchema.parse({ commissionBps: null })` throws `ZodError` (min/max int check rejects `null`).

- [ ] **Step 3: Implement — widen the write body only**

In `api/src/schemas/service.ts`, add the import (near the top, alongside the existing `zod`/`extendZodWithOpenApi` imports):

```typescript
import { CommissionBpsSchema } from './commission-config.js';
```

Change `UpdateServiceBodySchema` (currently at `service.ts:159-166`) from:

```typescript
export const UpdateServiceBodySchema = rejectPriceInProse(
  ServiceSchema.omit({
    id: true,
    categoryId: true,
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  }).partial(),
);
```

to:

```typescript
/**
 * Issue #334: `commissionBps` is widened to `.nullable()` on this WRITE body only,
 * mirroring `UpdateCategoryBodySchema` in service-category.ts:44-58 for the exact
 * same reason — a service-level override outranks category and global (see the
 * doc comment on `ServiceSchema.commissionBps` above), and until now had no way to
 * express "clear this override and inherit again." `ServiceSchema` itself (the
 * stored/read shape) is untouched; see `CatalogueRepository.updateService`
 * (catalogue-repository.ts) for how `null` is interpreted as "delete this key"
 * rather than written as a literal null.
 */
export const UpdateServiceBodySchema = rejectPriceInProse(
  ServiceSchema.omit({
    id: true,
    categoryId: true,
    isActive: true,
    updatedBy: true,
    createdAt: true,
    updatedAt: true,
  })
    .partial()
    .extend({
      commissionBps: CommissionBpsSchema.nullable().optional(),
    }),
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && npx vitest run tests/catalogue-patch-semantics.test.ts`
Expected: PASS — all tests in the file, including the three new ones and every pre-existing one (this is a strict superset change: `.extend()` after `.partial()` only widens one field).

- [ ] **Step 5: Re-run Task 1's tests — they should still fail here (expected)**

Run: `cd api && npx vitest run tests/catalogue-admin.test.ts -t "commission override"`
Expected: still FAIL, but now for a different reason than Step 3 of Task 1 — the schema now accepts the body, so the handler proceeds to call `catalogueRepo.updateService('ac-deep-clean', { commissionBps: null }, 'dev-user')`, but the repository itself (Task 3's job) does not yet interpret `null` specially, so nothing here breaks — the mock simply records whatever was called, and the test's `toHaveBeenCalledWith` assertion should now actually PASS for the super-admin case. Confirm: if it passes now, that's correct — it means the schema and handler plumbing were the only blocker for that assertion. The 403 test should already have been passing since Task 1 (it never reaches the schema-dependent path). If the super-admin test still fails at this step, stop and diagnose before continuing to Task 3 — do not paper over it.

- [ ] **Step 6: Commit**

```bash
git add api/src/schemas/service.ts api/tests/catalogue-patch-semantics.test.ts api/tests/catalogue-admin.test.ts
git commit -m "fix(api): accept null commissionBps on UpdateServiceBodySchema

Mirrors UpdateCategoryBodySchema (E21-S03 #327). ServiceSchema (read
path) is untouched -- only the write body widens. Closes half of #334."
```

---

## Task 3: Repository — `updateService` interprets `null` as delete-the-key

**Files:**
- Modify: `api/src/cosmos/catalogue-repository.ts:125-131` (the `updateService` method)
- Test: `api/tests/catalogue-patch-semantics.test.ts` (modify — extend `makeMockClient` to accept a service fixture, add a `serviceWithOverride` fixture, add a `describe('commissionBps: set / leave-unchanged / clear (service)')` block mirroring the existing category one at lines ~239-274)

**Interfaces:**
- Consumes: `UpdateServiceBodySchema` (Task 2), `definedOnly()` helper (existing, `catalogue-repository.ts:19-23`).
- Produces: `CatalogueRepository.updateService(id, body, uid)` now deletes the stored `commissionBps` key when `body.commissionBps === null`, matching `updateCategory`'s behavior exactly. This is what Task 1's super-admin test (once passing end-to-end) and the handler both depend on.

- [ ] **Step 1: Write the failing repository tests**

In `api/tests/catalogue-patch-semantics.test.ts`, first extend `makeMockClient` (currently `function makeMockClient(category: ServiceCategory = richCategory)`) to also accept a service parameter, since the existing signature hardcodes `richService` for every caller:

```typescript
function makeMockClient(category: ServiceCategory = richCategory, service: Service = richService) {
```

Then change every reference to `richService` inside that function's `svcContainer` block (currently `read: vi.fn().mockResolvedValue({ resource: richService })` and the `query`/`fetchAll` mock returning `resources: [richService]`) to use the `service` parameter instead of the hardcoded `richService`. This is a backward-compatible signature change — every existing call site passes 0 or 1 positional arg, so all pass `service` implicitly as the default `richService`, identical to today's behavior.

Add a service fixture, next to the existing `categoryWithOverride` fixture:

```typescript
// Issue #334: mirrors categoryWithOverride above -- a service that already carries
// an explicit commission override, used by the clear-the-override tests below.
const serviceWithOverride: Service = {
  ...richService,
  commissionBps: 2900,
};
```

Add a new describe block, mirroring the existing category one (~lines 239-274) exactly, but calling `repo.updateService` and asserting against `replaceSpy` (the mock for `svcs.item().replace`, already defined at the top of the file) instead of `catUpsertSpy`:

```typescript
describe('commissionBps: set / leave-unchanged / clear (service)', () => {
  it('a numeric commissionBps sets the override', async () => {
    await repo.updateService('ac-deep-clean', { commissionBps: 2750 }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect(written.commissionBps).toBe(2750);
  });

  it('an omitted commissionBps leaves an existing override unchanged', async () => {
    _setCosmosClientForTest(makeMockClient(richCategory, serviceWithOverride));

    await repo.updateService('ac-deep-clean', { name: 'AC Deep Clean Plus' }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect(written.commissionBps).toBe(serviceWithOverride.commissionBps);
  });

  it('an explicit null commissionBps removes the key so the service inherits category/global again', async () => {
    _setCosmosClientForTest(makeMockClient(richCategory, serviceWithOverride));

    await repo.updateService('ac-deep-clean', { commissionBps: null }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect('commissionBps' in written).toBe(false);
  });

  it('null does not disturb the service name-only fields already covered above', async () => {
    _setCosmosClientForTest(makeMockClient(richCategory, serviceWithOverride));

    await repo.updateService('ac-deep-clean', { commissionBps: null, name: 'AC Deep Clean Plus' }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect('commissionBps' in written).toBe(false);
    expect(written.name).toBe('AC Deep Clean Plus');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && npx vitest run tests/catalogue-patch-semantics.test.ts -t "clear (service)"`
Expected: FAIL on the `null` case — `updateService` currently does `{ ...existing, ...definedOnly(body), ... }`, and `definedOnly` only strips `undefined`, never `null` (see its implementation, `catalogue-repository.ts:19-23`), so today it would write a literal `commissionBps: null` into the document rather than delete the key. `expect('commissionBps' in written).toBe(false)` fails.

- [ ] **Step 3: Implement — mirror `updateCategory`'s destructure exactly**

Change `updateService` (currently `catalogue-repository.ts:125-131`) from:

```typescript
async updateService(id: string, body: UpdateServiceBody, uid: string): Promise<Service | null> {
  const existing = await this.getServiceByIdCrossPartition(id);
  if (!existing) return null;
  const updated: Service = { ...existing, ...definedOnly(body), id, categoryId: existing.categoryId, updatedBy: uid, updatedAt: now() };
  const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
  return resource!;
}
```

to:

```typescript
async updateService(id: string, body: UpdateServiceBody, uid: string): Promise<Service | null> {
  const existing = await this.getServiceByIdCrossPartition(id);
  if (!existing) return null;
  // Issue #334: same commissionBps null-means-clear handling as updateCategory above
  // (see that method's doc comment for the full rationale) -- definedOnly only ever
  // strips undefined, never null, so it's pulled out and applied separately.
  const { commissionBps, ...rest } = body;
  const updated: Service = { ...existing, ...definedOnly(rest), id, categoryId: existing.categoryId, updatedBy: uid, updatedAt: now() };
  if (commissionBps === null) {
    delete updated.commissionBps;
  } else if (commissionBps !== undefined) {
    updated.commissionBps = commissionBps;
  }
  const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
  return resource!;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && npx vitest run tests/catalogue-patch-semantics.test.ts`
Expected: PASS — every test in the file.

- [ ] **Step 5: Run Task 1's handler tests — they must now fully pass**

Run: `cd api && npx vitest run tests/catalogue-admin.test.ts`
Expected: PASS — every test in the file, including both new ones from Task 1.

- [ ] **Step 6: Run the full API test suite**

Run: `cd api && npx vitest run`
Expected: PASS, zero regressions. This confirms the `makeMockClient` signature change in Step 1 didn't break any of the ~15+ other tests in this file that call it with 0 or 1 arg.

- [ ] **Step 7: Commit**

```bash
git add api/src/cosmos/catalogue-repository.ts api/tests/catalogue-patch-semantics.test.ts
git commit -m "fix(api): updateService deletes commissionBps key on explicit null

Mirrors updateCategory (E21-S03 #327) exactly -- definedOnly only
strips undefined, so null is pulled out and handled separately.
Closes the other half of #334's clearing bug."
```

---

## Task 3.5: Repository — `listAllServices()` for the roster (Decision D1)

**Files:**
- Modify: `api/src/cosmos/catalogue-repository.ts` (add new method, near `listAllActiveServices` at line 97)
- Modify: `api/src/functions/catalogue-admin.ts` (extend `listAdminServicesHandler` at line 162 with the `includeInactive` param)
- Test: `api/tests/catalogue-patch-semantics.test.ts` or a new small block in `api/tests/catalogue-admin.test.ts` — whichever existing file already tests `listAdminServicesHandler`; check both files for a `describe('GET /v1/admin/catalogue/services')` block and add there.

**Interfaces:**
- Consumes: nothing new.
- Produces: `CatalogueRepository.listAllServices(): Promise<Service[]>` (no `isActive` filter). `GET /v1/admin/catalogue/services?includeInactive=true` now returns inactive services too; the endpoint's existing default behavior (param absent) is unchanged. WS-B's roster fetch (Task 5) calls this with `includeInactive=true`.

- [ ] **Step 1: Find the existing test for `listAdminServicesHandler`**

Search: `grep -n "listAdminServicesHandler\|adminListServices" api/tests/*.test.ts` — this endpoint already has some test coverage (it's an existing route); locate it and match that file's mocking style for `catalogueRepo.listAllActiveServices` / `listServicesByCategory`.

- [ ] **Step 2: Write the failing tests**

```typescript
it('listAllServices returns every service regardless of isActive', async () => {
  // Arrange the mock Cosmos client / repo spy so the underlying query has no
  // "WHERE c.isActive = true" filter -- mirror how listAllActiveServices is
  // tested elsewhere in this file (same container, same query mock shape),
  // but assert the query string passed to items.query() does NOT contain
  // "isActive" the way listAllActiveServices's does.
});

it('GET /v1/admin/catalogue/services?includeInactive=true calls listAllServices', async () => {
  const res = await listAdminServicesHandler(
    makeReq('http://localhost/api/v1/admin/catalogue/services?includeInactive=true'),
    {} as never,
    mockAdmin,
  );
  expect(res.status).toBe(200);
  expect(vi.mocked(catalogueRepo.listAllServices)).toHaveBeenCalled();
  expect(vi.mocked(catalogueRepo.listAllActiveServices)).not.toHaveBeenCalled();
});

it('GET /v1/admin/catalogue/services with no includeInactive param is unchanged', async () => {
  const res = await listAdminServicesHandler(
    makeReq('http://localhost/api/v1/admin/catalogue/services'),
    {} as never,
    mockAdmin,
  );
  expect(res.status).toBe(200);
  expect(vi.mocked(catalogueRepo.listAllActiveServices)).toHaveBeenCalled();
  expect(vi.mocked(catalogueRepo.listAllServices)).not.toHaveBeenCalled();
});
```

Adjust the exact mocking mechanics (`vi.mock('../src/cosmos/catalogue-repository.js', ...)` setup) to match however this test file already mocks `catalogueRepo` for the sibling category/service tests — do not introduce a second mocking style in the same file.

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd api && npx vitest run -t "listAllServices\|includeInactive"`
Expected: FAIL — `catalogueRepo.listAllServices` does not exist yet; `listAdminServicesHandler` does not read an `includeInactive` query param yet.

- [ ] **Step 4: Implement — repository method**

Add to `CatalogueRepository`, immediately after `listAllActiveServices` (`catalogue-repository.ts:97-101`):

```typescript
/**
 * Issue #334: mirrors listAllCategories() above -- no isActive filter. Backs the
 * commission-settings service-override roster, which must show an override even
 * on a now-inactive service (the same invisibility bug this issue exists to fix,
 * one state over). Deliberately NOT used by the default GET /v1/admin/catalogue/services
 * path -- see listAdminServicesHandler's includeInactive param.
 */
async listAllServices(): Promise<Service[]> {
  const { resources } = await this.svcs.items
    .query<Service>('SELECT * FROM c')
    .fetchAll();
  return resources;
}
```

- [ ] **Step 5: Implement — route param**

Change `listAdminServicesHandler` (`catalogue-admin.ts:162-168`) from:

```typescript
export async function listAdminServicesHandler(req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const categoryId = req.query.get('categoryId') ?? undefined;
  const services = categoryId
    ? await catalogueRepo.listServicesByCategory(categoryId)
    : await catalogueRepo.listAllActiveServices();
  return { status: 200, headers: JSON_HEADERS, jsonBody: { services } };
}
```

to:

```typescript
export async function listAdminServicesHandler(req: HttpRequest, _ctx: InvocationContext, _admin: AdminContext): Promise<HttpResponseInit> {
  const categoryId = req.query.get('categoryId') ?? undefined;
  // Issue #334: includeInactive is used only by the commission-settings override
  // roster (admin-web CommissionSettingsClient) -- every other caller of this
  // route omits the param and keeps today's active-only behavior unchanged.
  const includeInactive = req.query.get('includeInactive') === 'true';
  const services = categoryId
    ? await catalogueRepo.listServicesByCategory(categoryId)
    : includeInactive
      ? await catalogueRepo.listAllServices()
      : await catalogueRepo.listAllActiveServices();
  return { status: 200, headers: JSON_HEADERS, jsonBody: { services } };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd api && npx vitest run`
Expected: PASS, zero regressions across the full API suite.

- [ ] **Step 7: Commit**

```bash
git add api/src/cosmos/catalogue-repository.ts api/src/functions/catalogue-admin.ts api/tests/
git commit -m "feat(api): listAllServices + includeInactive param for the commission roster

Mirrors listAllCategories' no-filter shape. Default GET behavior for
every other caller of /v1/admin/catalogue/services is unchanged.
Supports #334's roster (WS-B)."
```

---

## Task 4: Regenerate the admin-web OpenAPI client (sync point)

**Files:**
- Modify (generated, do not hand-edit): `admin-web/src/api/generated/openapi.json`, `admin-web/src/api/generated/schema.d.ts`

**Interfaces:**
- Consumes: `api/src/schemas/service.ts`'s updated `UpdateServiceBodySchema` (Task 2) and the API's OpenAPI export (whatever generates `api/openapi.json` — check `api/package.json` for the export script if `admin-web`'s `openapi-sync.mjs` doesn't already pull straight from a running/built API; if it requires the API to be built or running, run that step first).
- Produces: `operations['adminUpdateService']['requestBody']['content']['application/json']` now includes `commissionBps?: number | null`, which `ServiceForm.tsx`'s existing type alias (`UpdateServiceBody`, line 14-16) already derives from — no type-alias edit needed in `ServiceForm.tsx`, only a regen.

- [ ] **Step 1: Check what `openapi-sync.mjs` needs**

Run: `cat admin-web/scripts/openapi-sync.mjs | head -30` — determine whether it reads `api/openapi.json` directly from the filesystem (in which case check whether `api/src/schemas/service.ts`'s change is already reflected there, or whether a separate `api` build/export step must run first) or fetches from a running API instance.

- [ ] **Step 2: Run the regen**

```bash
cd admin-web && pnpm run openapi:client
```

- [ ] **Step 3: Confirm the new type is present**

Run: `grep -n "commissionBps" admin-web/src/api/generated/schema.d.ts | grep -i "adminUpdateService" -A2 -B2` or more simply: `grep -B5 "commissionBps" admin-web/src/api/generated/schema.d.ts | grep -i "null"` — confirm at least one `commissionBps` field in the regenerated file is typed to include `null`, corresponding to the update-service request body. If nothing shows `| null`, stop — Task 2's schema change did not propagate; diagnose the OpenAPI export path before continuing to WS-B.

- [ ] **Step 4: Run the admin-web typecheck to confirm nothing broke**

Run: `cd admin-web && pnpm typecheck`
Expected: PASS. (This regen only adds a `null` option to one optional field — should be a strict widening, not a breaking type change anywhere existing code touches it.)

- [ ] **Step 5: Commit the regenerated files**

```bash
cd admin-web && git add src/api/generated/openapi.json src/api/generated/schema.d.ts
git commit -m "chore(admin-web): regen OpenAPI client for nullable service commissionBps"
```

---

## Task 5: admin-web API client — `updateServiceCommission`

**Files:**
- Modify: `admin-web/src/api/commissions.ts` (add function, near `updateCategoryCommission` at line ~173)
- Test: `admin-web/tests/api/commissions.test.ts` or wherever `updateCategoryCommission` is already tested — find it with `grep -rn "updateCategoryCommission" admin-web/tests/`

**Interfaces:**
- Consumes: `getBrowserClient()` (existing, same file), `AdminService` type (from `admin-web/src/components/catalogue/ServiceForm.tsx:8`, or wherever it's canonically exported — check `commissions.ts`'s existing imports for `AdminServiceCategory`'s source and mirror it for `AdminService`).
- Produces: `updateServiceCommission(serviceId: string, commissionBps: number | null): Promise<AdminService>`, consumed by Task 7 (roster UI).

- [ ] **Step 1: Find and read the existing test for `updateCategoryCommission`**

```bash
grep -rn "updateCategoryCommission" admin-web/tests/
```
Read that test to mirror its mocking style (likely mocks `getBrowserClient` or the underlying `openapi-fetch` client).

- [ ] **Step 2: Write the failing test**

```typescript
it('updateServiceCommission PUTs { commissionBps } to the service endpoint', async () => {
  // Mirror the exact mock setup from the updateCategoryCommission test above --
  // same client mock, same assertion shape, different route.
  await updateServiceCommission('ac-deep-clean', null);
  expect(mockPUT).toHaveBeenCalledWith('/v1/admin/catalogue/services/{id}', {
    params: { path: { id: 'ac-deep-clean' } },
    body: { commissionBps: null },
  });
});
```

(Replace `mockPUT` with whatever the actual mocked call reference is named in the sibling `updateCategoryCommission` test — copy its exact structure.)

- [ ] **Step 3: Run test to verify it fails**

Run: `cd admin-web && npx vitest run <path-to-test-file> -t "updateServiceCommission"`
Expected: FAIL — function does not exist.

- [ ] **Step 4: Implement**

Add to `admin-web/src/api/commissions.ts`, immediately after `updateCategoryCommission` (line ~182):

```typescript
export async function updateServiceCommission(
  serviceId: string,
  commissionBps: number | null,
): Promise<AdminService> {
  const result = await getBrowserClient().PUT('/v1/admin/catalogue/services/{id}', {
    params: { path: { id: serviceId } },
    body: { commissionBps },
  });
  return unwrap(result, 'PUT');
}
```

Add the `AdminService` type import at the top of the file if not already present (check existing imports — `AdminServiceCategory` is imported from somewhere, likely `@/api/generated/schema`; `AdminService` should come from the same place or from `ServiceForm.tsx`'s export).

- [ ] **Step 5: Run test to verify it passes**

Run: `cd admin-web && npx vitest run <path-to-test-file>`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add admin-web/src/api/commissions.ts admin-web/tests/
git commit -m "feat(admin-web): add updateServiceCommission client function

Mirrors updateCategoryCommission. Supports #334's clear-override UI."
```

---

## Task 6: `ServiceForm.tsx` — send `null` when a set override is cleared

**Files:**
- Modify: `admin-web/src/components/catalogue/ServiceForm.tsx:80-96` (the `commissionPatch` logic inside `handleSubmit`)
- Test: `admin-web/tests/components/catalogue/ServiceForm.test.tsx` (or wherever the existing `ServiceForm` tests live — `grep -rn "commissionPatch\|commissionBps" admin-web/tests/` to find the file and existing test names for the current "unchanged" and "set" cases, which must keep passing)

**Interfaces:**
- Consumes: `UpdateServiceBody` type (now includes `commissionBps?: number | null` after Task 4's regen).
- Produces: `handleSubmit`'s `edited` object now includes `commissionBps: null` in the emptied-a-set-override case; unchanged in every other case. This is the field-level fix issue #334 names as half the bug.

- [ ] **Step 1: Read the current logic and the existing tests for it**

Already read during planning (`ServiceForm.tsx:80-96`, quoted here for the implementer):

```typescript
let commissionPatch: { commissionBps: number } | Record<string, never> = {};
if (canSetCommission) {
  const trimmedCommission = commissionBps.trim();
  if (trimmedCommission !== '') {
    const commissionNum = parseInt(trimmedCommission, 10);
    if (isNaN(commissionNum)) {
      setError(t('serviceForm.validationError'));
      return;
    }
    if (commissionNum < 1500 || commissionNum > 3500) {
      setError(t('serviceForm.commissionRangeError'));
      return;
    }
    if (commissionNum !== initial?.commissionBps) {
      commissionPatch = { commissionBps: commissionNum };
    }
  }
}
```

The gap: when `trimmedCommission === ''`, `commissionPatch` stays `{}` unconditionally — it never checks whether `initial?.commissionBps` was previously set, which is the only case where an empty field means "clear," as opposed to "never had one, still don't."

Find the existing test file's cases for "commission unchanged when field left blank" and "commission set when field has a new value" — these must keep passing unmodified.

- [ ] **Step 2: Write the failing test**

Add a test alongside the existing commission ones, matching that file's existing render/fill/submit test pattern (`render(<ServiceForm initial={...} onSubmit={mockOnSubmit} .../>)`, fill the commission input, submit, assert on `mockOnSubmit`'s call args):

```typescript
it('emptying a previously-set commission field sends commissionBps: null', async () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  // Render with an `initial` service that HAS an override -- match however the
  // existing "commission set" test in this file constructs its super-admin auth
  // context and `initial` prop (canSetCommission requires role: 'super-admin').
  render(
    <ServiceForm
      categoryId="ac-repair"
      initial={{ /* ...same fixture shape as the existing tests, with */ commissionBps: 2900 }}
      onSubmit={mockOnSubmit}
      onCancel={vi.fn()}
    />,
  );

  const commissionInput = screen.getByLabelText(/commission/i); // match the exact label query the existing tests use
  await userEvent.clear(commissionInput);

  const submitButton = screen.getByRole('button', { name: /save|update/i }); // match existing button query
  await userEvent.click(submitButton);

  expect(mockOnSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ commissionBps: null }),
  );
});

it('leaving an already-empty commission field empty still sends nothing (no regression)', async () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ServiceForm
      categoryId="ac-repair"
      initial={{ /* ...no commissionBps set */ }}
      onSubmit={mockOnSubmit}
      onCancel={vi.fn()}
    />,
  );

  const submitButton = screen.getByRole('button', { name: /save|update/i });
  await userEvent.click(submitButton);

  const callArg = mockOnSubmit.mock.calls[0]?.[0];
  expect('commissionBps' in callArg).toBe(false);
});
```

Adjust the auth-context / super-admin rendering setup, exact label text, and button name to match whatever the existing passing tests in this file already use — do not invent new query selectors that diverge from the file's established convention.

- [ ] **Step 3: Run tests to verify the new one fails**

Run: `cd admin-web && npx vitest run <ServiceForm test path> -t "sends commissionBps: null"`
Expected: FAIL — `mockOnSubmit` is called with an object that has no `commissionBps` key at all (current behavior), not `commissionBps: null`.

- [ ] **Step 4: Implement**

Change the block (`ServiceForm.tsx:80-96`) from:

```typescript
let commissionPatch: { commissionBps: number } | Record<string, never> = {};
if (canSetCommission) {
  const trimmedCommission = commissionBps.trim();
  if (trimmedCommission !== '') {
    const commissionNum = parseInt(trimmedCommission, 10);
    if (isNaN(commissionNum)) {
      setError(t('serviceForm.validationError'));
      return;
    }
    if (commissionNum < 1500 || commissionNum > 3500) {
      setError(t('serviceForm.commissionRangeError'));
      return;
    }
    if (commissionNum !== initial?.commissionBps) {
      commissionPatch = { commissionBps: commissionNum };
    }
  }
}
```

to:

```typescript
// Issue #334: an emptied field means two different things depending on history --
// "never had an override, still don't" (no-op, omit the key) vs. "had one, now
// clear it" (send an explicit null so the API deletes the stored key -- see
// UpdateServiceBodySchema's doc comment in service.ts and CatalogueRepository
// .updateService for why omission cannot express this under PATCH semantics).
let commissionPatch: { commissionBps: number | null } | Record<string, never> = {};
if (canSetCommission) {
  const trimmedCommission = commissionBps.trim();
  if (trimmedCommission === '') {
    if (initial?.commissionBps !== undefined) {
      commissionPatch = { commissionBps: null };
    }
  } else {
    const commissionNum = parseInt(trimmedCommission, 10);
    if (isNaN(commissionNum)) {
      setError(t('serviceForm.validationError'));
      return;
    }
    if (commissionNum < 1500 || commissionNum > 3500) {
      setError(t('serviceForm.commissionRangeError'));
      return;
    }
    if (commissionNum !== initial?.commissionBps) {
      commissionPatch = { commissionBps: commissionNum };
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd admin-web && npx vitest run <ServiceForm test path>`
Expected: PASS, including every pre-existing test in the file (the "set" and "unchanged-with-value-present" cases are untouched by this change; only the "empty" branch gained a condition).

- [ ] **Step 6: Commit**

```bash
git add admin-web/src/components/catalogue/ServiceForm.tsx admin-web/tests/
git commit -m "fix(admin-web): ServiceForm sends commissionBps: null when a set override is cleared

Emptying the field now distinguishes 'never had one' (still a no-op)
from 'had one, clear it' (explicit null). Closes the UI half of #334
-- the API half (Tasks 2-3) makes the null meaningful; this makes the
form actually send it."
```

---

## Task 7: Commission-settings roster — "Service overrides" section

**Files:**
- Modify: `admin-web/src/components/settings/CommissionSettingsClient.tsx` (add state, fetch, handlers, and a new table section mirroring the existing category one)
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json` (new i18n keys under the `settings.rates` or a sibling namespace — check which namespace the existing `settings.rates.*` keys sit under and add alongside them)
- Test: `admin-web/tests/components/settings/CommissionSettingsClient.test.tsx` (or wherever this component's existing category-roster tests live)

**Interfaces:**
- Consumes: `updateServiceCommission` (Task 5), a service-listing fetch (either an existing `fetchServices`-style function in `admin-web/src/api/commissions.ts` or `catalogue.ts` — find it — extended to pass `includeInactive=true`, or a new small wrapper calling `GET /v1/admin/catalogue/services?includeInactive=true`).
- Produces: a rendered table of every service with `commissionBps !== undefined`, each row showing service name, category, effective rate, and a "Clear override" button. No new consumers — this is the terminal UI task for the read-surface half of #334.

- [ ] **Step 1: Find the admin-web fetch function for services**

```bash
grep -rn "adminListServices\|/v1/admin/catalogue/services" admin-web/src/api/*.ts
```
Identify whether an existing function like `fetchServices()` exists to extend with an `includeInactive` param, or whether one needs to be added following the same pattern as `fetchCategories`/whatever backs the category roster's `initialCategories` prop (check `CommissionSettingsClient.tsx`'s props, line ~37, `initialCategories?: AdminServiceCategory[]` — find where that prop is populated, likely a server component page file, and mirror it for services).

- [ ] **Step 2: Read the full existing category-roster block one more time for exact copy**

Already read during planning — `CommissionSettingsClient.tsx` lines ~283-297 (draft initialization effect), ~399-433 (`handleSaveCategory`/`handleClearCategory`), ~535-610 (the table JSX). The new service section mirrors all three, adapted as follows:
- No "set override" input/button needed in the roster — setting is already done via `ServiceForm` per the existing division of labor (category settings page sets/clears category rates directly; service rates are set per-service in the catalogue). The roster's job here is **read + clear only**.
- Each row needs a category name/link alongside the service name, since services (unlike categories) belong to one.

- [ ] **Step 3: Write the failing test**

```typescript
it('renders a service overrides section listing every service with commissionBps set', () => {
  render(
    <CommissionSettingsClient
      initialConfig={mockConfig}
      initialCategories={[]}
      initialServices={[
        { id: 'ac-deep-clean', name: 'AC Deep Clean', categoryId: 'ac-repair', commissionBps: 2900, /* ...other required Service fields */ },
        { id: 'tap-repair', name: 'Tap Repair', categoryId: 'plumbing', /* no commissionBps -- should NOT appear */ },
      ]}
    />,
  );

  expect(screen.getByText('AC Deep Clean')).toBeInTheDocument();
  expect(screen.queryByText('Tap Repair')).not.toBeInTheDocument();
});

it('clicking Clear on a service override calls updateServiceCommission with null', async () => {
  const mockUpdate = vi.spyOn(commissionsApi, 'updateServiceCommission').mockResolvedValue({
    /* updated service with commissionBps removed */
  } as AdminService);

  render(
    <CommissionSettingsClient
      initialConfig={mockConfig}
      initialCategories={[]}
      initialServices={[{ id: 'ac-deep-clean', name: 'AC Deep Clean', categoryId: 'ac-repair', commissionBps: 2900 }]}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: /clear/i }));

  expect(mockUpdate).toHaveBeenCalledWith('ac-deep-clean', null);
});
```

Adjust fixture shapes to whatever `AdminService`/`Service` actually requires (check the type — it likely needs `heroImageUrl`, `basePrice`, `durationMinutes`, etc. even for a test fixture, since it's `.strict()` on the wire but the component prop type may be looser — check `CommissionSettingsClient.tsx`'s current `initialCategories` prop type for the equivalent looseness on categories and match it for the new `initialServices` prop).

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd admin-web && npx vitest run <CommissionSettingsClient test path> -t "service overrides"`
Expected: FAIL — no such prop, section, or handler exists yet.

- [ ] **Step 5: Implement — state, effect, handlers**

Add a new prop to the `CommissionSettingsClientProps` interface (near the existing `initialCategories?: AdminServiceCategory[]` at line ~37):

```typescript
initialServices?: AdminService[];
```

Add state (near the existing `categories`/`categoriesError` state at lines ~179-188):

```typescript
const [services, setServices] = useState<AdminService[] | null>(initialServices ?? null);
const [servicesError, setServicesError] = useState<string | null>(null);
const [serviceSavingId, setServiceSavingId] = useState<string | null>(null);
```

Add a clear handler, mirroring `handleClearCategory` (lines ~419-433) exactly but without the draft-input bookkeeping (there's no settable draft here, only clear):

```typescript
async function handleClearService(serviceId: string) {
  setServiceSavingId(serviceId);
  try {
    const updated = await updateServiceCommission(serviceId, null);
    setServices((prev) => prev?.map((s) => (s.id === serviceId ? updated : s)) ?? prev);
    show(t('settings.messages.serviceCleared'), 'success');
  } catch {
    setServicesError(t('settings.errors.serviceClearFailed'));
    show(t('settings.errors.serviceClearFailed'), 'error');
  } finally {
    setServiceSavingId(null);
  }
}
```

Import `updateServiceCommission` and `AdminService` at the top of the file alongside the existing `updateCategoryCommission` import.

- [ ] **Step 6: Implement — table JSX**

Add a new section after the existing category-overrides table (after line ~610's closing `</div>`), following the exact structure of the category table but filtered to overridden services only and without a settable-draft input column:

```tsx
<div className="mt-[var(--space-6)]">
  <h2 className="text-[length:var(--text-base)] font-semibold text-[var(--color-text)]">
    {t('settings.rates.serviceOverridesHeading')}
  </h2>
  {servicesError !== null && (
    <p className="text-xs text-[var(--color-warn)]">{servicesError}</p>
  )}
  {services !== null && (() => {
    const overridden = services.filter((s) => s.commissionBps !== undefined);
    if (overridden.length === 0) {
      return <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{t('settings.rates.noServiceOverrides')}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[length:var(--text-sm)]">
          <thead>
            <tr className="text-left text-xs text-[var(--color-text-muted)]">
              <th scope="col">{t('settings.rates.columns.service')}</th>
              <th scope="col" className="text-right">
                {t('settings.rates.columns.effectiveRate')}
              </th>
              <th scope="col">{t('settings.rates.columns.override')}</th>
            </tr>
          </thead>
          <tbody>
            {overridden.map((service) => {
              const saving = serviceSavingId === service.id;
              return (
                <tr key={service.id} className="border-t border-[var(--color-border)]">
                  <td className="py-[var(--space-2)] text-[var(--color-text)]">
                    {service.name}
                  </td>
                  <td className="text-right font-mono tabular-nums text-[var(--color-text)]">
                    {formatBpsAsPercent(service.commissionBps!)}%
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void handleClearService(service.id)}
                      disabled={saving}
                      className="px-2 py-1 rounded border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                    >
                      {t('settings.rates.clearOverride')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  })()}
</div>
```

Note `settings.rates.clearOverride` is an existing key (already used by the category table) — reused, not duplicated.

- [ ] **Step 7: Add new i18n keys**

In `admin-web/messages/en.json`, under the same namespace as the existing `settings.rates.*` keys (find the exact nesting by locating `"clearOverride"` in the file and adding siblings):

```json
"serviceOverridesHeading": "Service overrides",
"noServiceOverrides": "No services currently carry a commission override.",
```

and under `settings.messages` / `settings.errors` (find those namespaces the same way):

```json
"serviceCleared": "Service commission override cleared.",
```
```json
"serviceClearFailed": "Could not clear the service's commission override. Try again."
```

Add the matching Hindi translations to `admin-web/messages/hi.json` in the same nested locations — do not leave English fallback text in the Hindi file (that's the exact `nameHiLabel`-shaped gap this session already found and closed in the deploy verification for #327/#328's Hindi keys; don't reintroduce that class of gap here).

- [ ] **Step 8: Write a test pinning the real message files (not a mock)**

```typescript
it('every new settings.rates key exists in both en and hi message files', () => {
  const en = require('../../../messages/en.json');
  const hi = require('../../../messages/hi.json');
  for (const key of ['serviceOverridesHeading', 'noServiceOverrides']) {
    expect(typeof en.settings.rates[key]).toBe('string'); // adjust path to match actual nesting found in Step 7
    expect(typeof hi.settings.rates[key]).toBe('string');
  }
});
```

(Adjust the require path and the `en.settings.rates` traversal to match the actual file location and nesting depth found in Step 7 — do not guess; use the same nesting as the existing `clearOverride` key sits under.)

- [ ] **Step 9: Run tests to verify everything passes**

Run: `cd admin-web && npx vitest run`
Expected: PASS, full suite, zero regressions.

- [ ] **Step 10: Commit**

```bash
git add admin-web/src/components/settings/CommissionSettingsClient.tsx admin-web/messages/en.json admin-web/messages/hi.json admin-web/tests/
git commit -m "feat(admin-web): service commission-override roster on the settings page

Read-only list of every service carrying an override, with a Clear
button reusing updateServiceCommission (Task 5). Mirrors the existing
category-overrides table. Closes the read-surface half of #334."
```

---

## Task 8: Wire the roster's data source (server-side prop)

**Files:**
- Find and modify: whatever server component currently populates `CommissionSettingsClient`'s `initialCategories` prop (search `grep -rn "initialCategories=" admin-web/app/` to locate the page file).

**Interfaces:**
- Consumes: the `includeInactive=true` fetch path (Task 3.5) via whichever server-side data-fetching helper this page already uses for categories (likely a direct `fetch` to the internal API or a shared server-side API client — match its existing pattern for categories exactly).
- Produces: `initialServices` prop populated with `GET /v1/admin/catalogue/services?includeInactive=true` results, passed into `CommissionSettingsClient` (Task 7's consumer).

- [ ] **Step 1: Locate the page file**

```bash
grep -rn "initialCategories=" admin-web/app/
```

- [ ] **Step 2: Read how `initialCategories` is fetched there**

Read the surrounding server component code to see the exact fetch call/helper used for categories (e.g., a server-side `fetch('/admin-api/v1/admin/catalogue/categories', ...)` or a shared helper function).

- [ ] **Step 3: Write the equivalent for services**

Add a parallel fetch for `GET /v1/admin/catalogue/services?includeInactive=true`, following the exact same pattern (headers, error handling, auth cookie forwarding) as the categories fetch immediately above/below it in the same file, and pass the result as `initialServices` to `<CommissionSettingsClient>`.

- [ ] **Step 4: Manual verification (no automated test for this wiring — it's server-component plumbing already covered by Task 7's component tests via props)**

Run: `cd admin-web && pnpm dev` and visit the commission settings page locally (or run existing Playwright e2e for this page if one exists — check `admin-web/tests/e2e/` or similar for a `commission` or `settings` spec) to confirm the new section renders without erroring given real (or seeded) data.

- [ ] **Step 5: Commit**

```bash
git add <the page file>
git commit -m "feat(admin-web): fetch services (incl. inactive) for the commission settings page

Wires Task 3.5's includeInactive path into Task 7's roster prop."
```

---

## Task 9: Smoke gates, Codex review, push

- [ ] **Step 1: Run the API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Non-zero exit = stop and fix before continuing.

- [ ] **Step 2: Run the admin-web smoke gate**

```bash
bash tools/pre-codex-smoke-web.sh
```
Non-zero exit = stop and fix before continuing.

- [ ] **Step 3: Codex review**

```bash
codex review --base main
```
Fix any P0/P1 in this session; if a round fails, fix and re-run once (per project policy — do not burn multiple Codex rounds iterating).

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin fix/issue-334-commission-override-clearable
gh pr create --base main --title "fix: service commissionBps override is now clearable + has a roster (#334)" --body "Closes #334. See plan at plans/issue-334-commission-override-clearable.md for full task breakdown. Mirrors the category-override pattern from E21-S03 (#327) at every layer: nullable write body, repository null-means-delete, admin-web client function, and a read-only roster on the commission settings page. Includes a scoped includeInactive fetch path so an override on a deactivated service stays visible (the category roster already had this; services didn't)."
```

- [ ] **Step 5: Arm auto-merge once CI is green**

```bash
gh pr merge <PR-number> --squash --auto
```

---

## Self-Review Notes (completed during plan authoring, not a task for the executor)

- **Spec coverage:** Issue #334's three asks — (1) nullable write body, (2) form sends null, (3) roster — map to Tasks 2-3 (write body + repo), Task 6 (form), and Tasks 3.5/7/8 (roster + its data source) respectively. `commissionBpsForbidden` non-weakening is pinned by Task 1's tests.
- **Type consistency:** `commissionPatch` type in Task 6 changes from `{ commissionBps: number } | Record<string, never>` to `{ commissionBps: number | null } | Record<string, never>` — checked against Task 4's regenerated `UpdateServiceBody` type, which now accepts `number | null` for this field, so no mismatch.
- **No placeholders:** every code block above is complete, working TypeScript/Zod, not a description of what to write. Test fixture field lists that say "match the existing X" point at a specific, locatable existing pattern in the same file rather than leaving the shape undefined — this is deliberate given how many exact existing fixtures this plan reuses, not a placeholder.

# E22-S01 — Bilingual Catalogue Schema + Reprice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Hindi catalogue copy from a compiled-in Kotlin map into the API, apply the owner's new price list, and remove the rupee figures baked into service descriptions — so the owner can change a price in the dashboard and every Hindi customer sees it correctly without an app release.

**Architecture:** `nameHi` / `shortDescriptionHi` become optional fields on `ServiceSchema` and `ServiceCategorySchema`, served by the public catalogue endpoints. `CatalogueLocalizer` becomes a three-level fallback — server Hindi → compiled-in map → English — so APKs already in the field keep working and the customer-app release is *not* a blocker for the reprice. The seed applies the new prices and backfills Hindi, and stops clobbering the owner's `isActive` toggles.

**Tech Stack:** Node 22 + TypeScript (`strict`, `exactOptionalPropertyTypes`) + Zod + Azure Functions + Cosmos; Next.js 15 + next-intl; Kotlin + Compose + Moshi.

**Spec:** `C:\Users\alokt\.claude\plans\act-as-a-principal-ticklish-fern.md` → "Wave 1 — R1 + R7". Owner requirements are the handwritten notes of 2026-09-03; decisions confirmed in that session are reproduced verbatim under Global Constraints.

**Tier:** Foundation (schema + a production data change).

---

## Global Constraints

- **Prices are applied exactly as the owner wrote them.** No price is invented, rounded, or "corrected". The table in Task 3 is the whole change.
- **Blank prices stay blank.** Services the owner did not price are out of scope for this story (they land in E22-S02 as inactive drafts). Do not guess a price to fill a gap.
- **Money is integer paise.** `₹999` is `99900`. Never a float, never a string.
- **A price must never appear in prose.** Not in English, not in Hindi. The price is rendered from `basePrice` by `CataloguePriceFormat.formatPrice`. This is the defect this story exists to prevent, so it is a rule, not a preference.
- **Hindi is the customer-app default** (ADR-0018). A missing Hindi string is a visible product defect, not a cosmetic one.
- **Schemas are `.strict()`.** Adding a field means adding it to the OpenAPI registry and regenerating the admin-web client, or CI fails on drift.
- **`exactOptionalPropertyTypes` is on.** `foo?: string` and `foo: string | undefined` are different types; do not add `| undefined` to optional Zod fields and expect spreads to typecheck.
- **TDD.** Test first, watch it fail, implement, watch it pass, commit. Every task.
- **Do not run the production seed** until Task 8. It is the last step and it is gated on a human.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `api/src/schemas/service.ts` | Service shape + derived card/detail/create/update schemas | Modify |
| `api/src/schemas/service-category.ts` | Category shape + derived schemas | Modify |
| `api/src/openapi/registry.ts` | OpenAPI contract the admin client generates from | Modify |
| `api/src/cosmos/seeds/catalogue.ts` | Catalogue content source of truth + seed runner | Modify |
| `api/src/data/catalogue-ids.ts` | Hardcoded id mirror used by the waitlist handler | Modify |
| `tools/check-hindi-catalogue-parity.mjs` | CI guard: every service has Hindi copy | Create |
| `admin-web/src/components/catalogue/ServiceForm.tsx` | Service create/edit form | Modify |
| `admin-web/src/components/catalogue/CategoryForm.tsx` | Category create/edit form | Modify |
| `admin-web/messages/{en,hi}.json` | Admin UI strings | Modify |
| `customer-app/.../data/catalogue/remote/dto/ServiceDto.kt` | Wire DTOs | Modify |
| `customer-app/.../data/catalogue/remote/dto/CategoryDto.kt` | Wire DTOs | Modify |
| `customer-app/.../domain/catalogue/model/Service.kt` + `Category.kt` | Domain models | Modify |
| `customer-app/.../domain/catalogue/CatalogueLocalizer.kt` | Locale resolution | Modify |
| `customer-app/.../data/catalogue/HindiLocaleNames.kt` | Compiled-in fallback map | Modify |

**Not in this story** (deliberately): new categories and their hero images (E22-S02), per-unit pricing (E22-S03), the per-category `commissionBps` field and the global `defaultCommissionBps` editor (E22-S03 — they are rate-editor completion, not bilingual work).

---

## Context an executor will not infer from the code

Read these before Task 1. Each one has already caused a bug in this repo.

1. **`ServiceCardSchema` is a `.pick()`, not an `.omit()`.** Adding a field to `ServiceSchema` does **not** reach the card. The catalogue home renders cards, so a Hindi name added only to `ServiceSchema` would silently never appear on the main screen. Task 1 adds it to the pick explicitly.
2. **`ServiceDetailSchema` is an `.omit()`** and does flow automatically.
3. **The seed blind-upserts whole documents.** `svcContainer.items.upsert(svc)` replaces the stored doc, so a seed run today reverts every admin edit and re-activates anything the owner deactivated. Task 3 fixes the `isActive` half of that; the price overwrite is intentional for this story.
4. **The update body is a partial patch** as of PR #316. `UpdateServiceBodySchema` is `.partial()`; `ServiceForm` sends only the fields it owns on edit and must keep doing so. CREATE still requires `includes`/`faq`/`addOns`/`photoStages`.
5. **Moshi tolerates added nullable fields with defaults**, so new API fields will not break APKs already installed.
6. **`catalogue-ids.ts` is a hardcoded mirror** of the service ids, used by the waitlist handler.

---

## Task 1: Bilingual fields on the catalogue schemas

**Files:**
- Modify: `api/src/schemas/service.ts`
- Modify: `api/src/schemas/service-category.ts`
- Test: `api/tests/schemas/catalogue-bilingual.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `ServiceSchema` and `ServiceCategorySchema` gain `nameHi?: string`, `shortDescriptionHi?: string` (category: `nameHi?` only). `ServiceCardSchema` and `ServiceDetailSchema` both expose them. `CreateServiceBodySchema` / `UpdateServiceBodySchema` accept them.

- [ ] **Step 1: Write the failing test**

Create `api/tests/schemas/catalogue-bilingual.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  ServiceSchema,
  ServiceCardSchema,
  ServiceDetailSchema,
  UpdateServiceBodySchema,
} from '../../src/schemas/service.js';
import { ServiceCategorySchema } from '../../src/schemas/service-category.js';

const NOW = '2026-09-04T00:00:00.000Z';

const service = {
  id: 'ac-deep-clean',
  categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  nameHi: 'एसी डीप क्लीन',
  shortDescription: 'Chemical wash, gas check, filter clean.',
  shortDescriptionHi: 'केमिकल वॉश, गैस चेक, फिल्टर सफाई।',
  heroImageUrl: 'https://example.com/s.jpg',
  basePrice: 99900,
  durationMinutes: 90,
  includes: ['Chemical wash'],
  faq: [],
  addOns: [],
  photoStages: [],
  isActive: true,
  updatedBy: 'seed',
  createdAt: NOW,
  updatedAt: NOW,
};

describe('bilingual catalogue fields', () => {
  it('ServiceSchema accepts Hindi name and description', () => {
    expect(ServiceSchema.parse(service).nameHi).toBe('एसी डीप क्लीन');
  });

  it('Hindi fields are optional — existing documents still parse', () => {
    const { nameHi, shortDescriptionHi, ...withoutHindi } = service;
    expect(() => ServiceSchema.parse(withoutHindi)).not.toThrow();
  });

  // The catalogue HOME renders cards. ServiceCardSchema is a .pick(), so a field
  // added to ServiceSchema does NOT reach it automatically.
  it('ServiceCardSchema carries the Hindi fields', () => {
    const card = ServiceCardSchema.parse(service);
    expect(card.nameHi).toBe('एसी डीप क्लीन');
    expect(card.shortDescriptionHi).toBe('केमिकल वॉश, गैस चेक, फिल्टर सफाई।');
  });

  it('ServiceDetailSchema carries the Hindi fields', () => {
    expect(ServiceDetailSchema.parse(service).nameHi).toBe('एसी डीप क्लीन');
  });

  it('the update patch accepts a Hindi-only edit', () => {
    expect(UpdateServiceBodySchema.parse({ nameHi: 'नया नाम' })).toEqual({ nameHi: 'नया नाम' });
  });

  it('ServiceCategorySchema accepts a Hindi name and stays optional', () => {
    const category = {
      id: 'ac-repair',
      name: 'AC Repair',
      nameHi: 'एसी मरम्मत',
      heroImageUrl: 'https://example.com/c.jpg',
      sortOrder: 1,
      isActive: true,
      updatedBy: 'seed',
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(ServiceCategorySchema.parse(category).nameHi).toBe('एसी मरम्मत');
    const { nameHi, ...withoutHindi } = category;
    expect(() => ServiceCategorySchema.parse(withoutHindi)).not.toThrow();
  });

  it('rejects a blank Hindi string rather than storing an empty label', () => {
    expect(() => ServiceSchema.parse({ ...service, nameHi: '' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd api && npx vitest run tests/schemas/catalogue-bilingual.test.ts
```

Expected: FAIL — `.strict()` rejects the unrecognised key `nameHi`.

- [ ] **Step 3: Add the fields to `ServiceSchema`**

In `api/src/schemas/service.ts`, inside the `z.object({ ... })` passed to `ServiceSchema`, immediately after the `name` line:

```typescript
    name: z.string().min(1).max(100),
    /**
     * E22-S01: Hindi display name. The customer app is Hindi-default (ADR-0018) and
     * previously read Hindi from a compiled-in Kotlin map, so anything added through
     * the admin dashboard showed in English until a new APK shipped. Optional so
     * existing documents keep parsing; the parity guard in tools/ fails CI if a
     * seeded service is missing one.
     */
    nameHi: z.string().min(1).max(100).optional(),
```

And immediately after the `shortDescription` line:

```typescript
    shortDescription: z.string().min(1).max(200),
    /** E22-S01: Hindi short description. Must never contain a price — see Task 3. */
    shortDescriptionHi: z.string().min(1).max(200).optional(),
```

- [ ] **Step 4: Add the fields to the card pick**

Still in `api/src/schemas/service.ts`, extend `ServiceCardSchema`:

```typescript
export const ServiceCardSchema = ServiceSchema.pick({
  id: true,
  categoryId: true,
  name: true,
  nameHi: true,
  shortDescription: true,
  shortDescriptionHi: true,
  heroImageUrl: true,
  basePrice: true,
  durationMinutes: true,
}).strip();
```

`ServiceDetailSchema` is an `.omit()` and needs no change.

- [ ] **Step 5: Add the Hindi name to `ServiceCategorySchema`**

In `api/src/schemas/service-category.ts`, after the `name` line:

```typescript
    name: z.string().min(1).max(100).openapi({ example: 'AC Repair' }),
    /** E22-S01: Hindi display name — see the note on ServiceSchema.nameHi. */
    nameHi: z.string().min(1).max(100).optional().openapi({ example: 'एसी मरम्मत' }),
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd api && npx vitest run tests/schemas/catalogue-bilingual.test.ts && npx tsc --noEmit
```

Expected: 7 passed, typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add api/src/schemas/service.ts api/src/schemas/service-category.ts api/tests/schemas/catalogue-bilingual.test.ts
git commit -m "feat(api): E22-S01 — bilingual name/description fields on the catalogue schemas"
```

---

## Task 2: Serve the Hindi fields and freeze the contract

**Files:**
- Modify: `api/src/openapi/registry.ts`
- Test: `api/tests/catalogue-public.test.ts`

**Interfaces:**
- Consumes: Task 1's schemas.
- Produces: `GET /v1/categories` and `GET /v1/services/{id}` return `nameHi` / `shortDescriptionHi`; the regenerated admin client and the customer-app DTOs both depend on this shape.

`catalogue-public.ts` needs **no code change** — it already parses through `ServiceCardSchema` / `ServiceDetailSchema`, so Task 1 propagates automatically. This task proves that and updates the OpenAPI contract.

- [ ] **Step 1: Write the failing test**

Append to `api/tests/catalogue-public.test.ts`. The file mocks `catalogueRepo` at module level with fixed values, so override per-test with `mockResolvedValueOnce`:

```typescript
const BASE_SVC = {
  id: 'ac-deep-clean', categoryId: 'ac-repair', name: 'AC Deep Clean',
  shortDescription: 'Chemical wash.', heroImageUrl: 'https://example.com/s.jpg',
  basePrice: 99900, commissionBps: 2250, durationMinutes: 90,
  includes: [], faq: [], addOns: [], photoStages: [],
  isActive: true, updatedBy: 'u', createdAt: '2026-04-19T00:00:00.000Z', updatedAt: '2026-04-19T00:00:00.000Z',
};

describe('E22-S01 — bilingual fields reach the wire', () => {
  it('includes Hindi copy on the embedded service cards', async () => {
    vi.mocked(catalogueRepo.listAllActiveServices).mockResolvedValueOnce([
      { ...BASE_SVC, nameHi: 'एसी डीप क्लीन', shortDescriptionHi: 'केमिकल वॉश।' },
    ] as never);

    const res = await getCategoriesHandler(makeReq('http://localhost:7071/api/v1/categories'), {} as never);
    const body = res.jsonBody as { categories: Array<{ services: Array<Record<string, unknown>> }> };
    const card = body.categories[0]?.services[0];

    expect(card?.nameHi).toBe('एसी डीप क्लीन');
    expect(card?.shortDescriptionHi).toBe('केमिकल वॉश।');
  });

  it('omits the Hindi keys entirely for an English-only service', async () => {
    // Absence means "fall back" on the client. Emitting nameHi: null would
    // deserialize into a blank label instead of the English name.
    vi.mocked(catalogueRepo.listAllActiveServices).mockResolvedValueOnce([BASE_SVC] as never);

    const res = await getCategoriesHandler(makeReq('http://localhost:7071/api/v1/categories'), {} as never);
    const body = res.jsonBody as { categories: Array<{ services: Array<Record<string, unknown>> }> };
    const card = body.categories[0]?.services[0] ?? {};

    expect('nameHi' in card).toBe(false);
    expect('shortDescriptionHi' in card).toBe(false);
  });

  it('returns Hindi on the service detail endpoint too', async () => {
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValueOnce(
      { ...BASE_SVC, nameHi: 'एसी डीप क्लीन' } as never,
    );

    const res = await getServiceByIdHandler(
      makeReq('http://localhost:7071/api/v1/services/ac-deep-clean', { id: 'ac-deep-clean' }),
      {} as never,
    );

    expect((res.jsonBody as { nameHi?: string }).nameHi).toBe('एसी डीप क्लीन');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd api && npx vitest run tests/catalogue-public.test.ts
```

Expected: FAIL — the seeded fixture has no Hindi fields yet.

- [ ] **Step 3: Confirm no handler change is needed**

`catalogue-public.ts` parses through `ServiceCardSchema` / `ServiceDetailSchema`, so Task 1 already propagates the fields. If the first test still fails after Task 1, the card `.pick()` was not extended — go back to Task 1 Step 4.

- [ ] **Step 4: Register the fields in the OpenAPI contract**

`api/src/openapi/registry.ts` registers `ServiceCard`, `AdminService` and `AdminServiceCategory` from the Zod schemas. Confirm the emitted document now carries the new properties:

```bash
cd api && npm run build:openapi 2>/dev/null || npx tsx src/openapi/build.ts
grep -c "nameHi" openapi.json
```

Expected: a non-zero count. If the registry hardcodes property lists rather than deriving them, add `nameHi` and `shortDescriptionHi` there too.

- [ ] **Step 5: Run the api gate**

```bash
bash tools/pre-codex-smoke-api.sh
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/
git commit -m "feat(api): E22-S01 — serve bilingual catalogue fields, register in OpenAPI"
```

---

## Task 3: Reprice, strip prices from prose, backfill Hindi

This is the task that changes what customers pay. Read the whole task before starting.

**Files:**
- Modify: `api/src/cosmos/seeds/catalogue.ts`
- Test: `api/tests/catalogue-seed.test.ts`

**Interfaces:**
- Consumes: Task 1's schemas.
- Produces: `CATEGORIES` and `SERVICES` carry `nameHi` / `shortDescriptionHi`; `SERVICES` carries the new prices and a new `ac-deep-clean-window` entry; the seed runner preserves `isActive` on documents that already exist.

### The price table

Paise, exactly as the owner wrote them. Anything not listed is unchanged.

| Service id | Current | New | Note |
|---|---:|---:|---|
| `ac-deep-clean` | 59900 | **99900** | also strip `₹599` from both descriptions |
| `ac-gas-refill` | 149900 | 149900 | unchanged |
| `ac-installation` | 299900 | **149900** | large reduction, owner-confirmed |
| `ac-deep-clean-window` | — | **69900** | **new service**, category `ac-repair` |
| `water-pump-repair` | 69900 | **49900** | also strip `₹699` from both descriptions |
| `borewell-servicing` | 199900 | **99900** | large reduction, owner-confirmed |
| `electrical-fan-install` | 29900 | **24900** | |
| `electrical-switchboard-fix` | 39900 | **29900** | |
| `ro-installation` | 89900 | **39900** | large reduction, owner-confirmed |
| `ro-service-amc` | 49900 | **39900** | |
| `plumbing-leak-fix` | 39900 | 39900 | unchanged — owner left blank |
| `plumbing-tap-install` | 59900 | 59900 | unchanged — owner left blank |
| `plumbing-pipe-repair` | 79900 | 79900 | unchanged — owner left blank |
| `electrical-wiring` | 99900 | 99900 | unchanged — per-unit rate is E22-S03 |

- [ ] **Step 1: Write the failing test**

Append to `api/tests/catalogue-seed.test.ts`:

```typescript
import { CATEGORIES, SERVICES } from '../src/cosmos/seeds/catalogue.js';

describe('E22-S01 — reprice', () => {
  const priceOf = (id: string) => SERVICES.find((s) => s.id === id)?.basePrice;

  it.each([
    ['ac-deep-clean', 99900],
    ['ac-gas-refill', 149900],
    ['ac-installation', 149900],
    ['ac-deep-clean-window', 69900],
    ['water-pump-repair', 49900],
    ['borewell-servicing', 99900],
    ['electrical-fan-install', 24900],
    ['electrical-switchboard-fix', 29900],
    ['ro-installation', 39900],
    ['ro-service-amc', 39900],
    ['plumbing-leak-fix', 39900],
    ['plumbing-tap-install', 59900],
    ['plumbing-pipe-repair', 79900],
    ['electrical-wiring', 99900],
  ])('%s is priced at %i paise', (id, expected) => {
    expect(priceOf(id)).toBe(expected);
  });

  it('adds the window AC deep clean to the AC category', () => {
    const svc = SERVICES.find((s) => s.id === 'ac-deep-clean-window');
    expect(svc?.categoryId).toBe('ac-repair');
    expect(svc?.isActive).toBe(true);
  });
});

describe('E22-S01 — no price may appear in prose', () => {
  // A price in a sentence goes stale the moment the owner edits the price, and
  // then the app states a figure it does not charge. In a Hindi-default app that
  // is a false price claim to every customer.
  const RUPEE = /[₹]|\bRs\.?\b|\bINR\b/;

  it.each(SERVICES.map((s) => [s.id, s.shortDescription] as const))(
    '%s English description contains no price',
    (_id, text) => {
      expect(RUPEE.test(text)).toBe(false);
    },
  );

  it.each(SERVICES.map((s) => [s.id, s.shortDescriptionHi ?? ''] as const))(
    '%s Hindi description contains no price',
    (_id, text) => {
      expect(RUPEE.test(text)).toBe(false);
    },
  );

  it('no category name carries a price either', () => {
    for (const c of CATEGORIES) {
      expect(RUPEE.test(c.name)).toBe(false);
      expect(RUPEE.test(c.nameHi ?? '')).toBe(false);
    }
  });
});

describe('E22-S01 — Hindi coverage', () => {
  it('every seeded service has a Hindi name and description', () => {
    for (const s of SERVICES) {
      expect(s.nameHi, `${s.id} is missing nameHi`).toBeTruthy();
      expect(s.shortDescriptionHi, `${s.id} is missing shortDescriptionHi`).toBeTruthy();
    }
  });

  it('every seeded category has a Hindi name', () => {
    for (const c of CATEGORIES) {
      expect(c.nameHi, `${c.id} is missing nameHi`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd api && npx vitest run tests/catalogue-seed.test.ts
```

Expected: FAIL on prices, on the missing `ac-deep-clean-window`, on `₹599`/`₹699` in prose, and on missing Hindi.

- [ ] **Step 3: Apply the prices and rewrite the two prose descriptions**

Edit `api/src/cosmos/seeds/catalogue.ts`. The two descriptions that name a price become:

```typescript
// ac-deep-clean
shortDescription: 'Chemical wash, gas check, filter clean — everything included.',
// water-pump-repair
shortDescription: 'Surface + submersible pump troubleshooting and repair — everything included.',
```

Apply every `basePrice` from the table above.

- [ ] **Step 4: Backfill Hindi onto all five categories**

Add `nameHi` to each entry in `CATEGORIES`, taken from the existing Kotlin map so wording does not drift:

```typescript
'ac-repair'       → nameHi: 'एसी मरम्मत'
'water-pump'      → nameHi: 'वाटर पंप / बोरवेल'
'plumbing'        → nameHi: 'प्लंबिंग'
'electrical'      → nameHi: 'इलेक्ट्रिकल'
'water-purifier'  → nameHi: 'आरओ / वाटर प्यूरीफायर'
```

- [ ] **Step 5: Backfill Hindi onto all services**

Copy `nameHi` verbatim from `HindiLocaleNames.serviceHindiNames`, and `shortDescriptionHi` from `serviceShortDescriptionsHindi` — **except** the two that carry a price, which become:

```typescript
// ac-deep-clean
shortDescriptionHi: 'केमिकल वॉश, गैस चेक, फिल्टर सफाई — सब कुछ शामिल।',
// water-pump-repair
shortDescriptionHi: 'सरफेस + सबमर्सिबल पंप की जाँच और मरम्मत — सब कुछ शामिल।',
```

- [ ] **Step 6: Add the window AC service**

Insert after `ac-deep-clean` in `SERVICES`, following the surrounding shape exactly. Note `photoStages` is populated — an empty array would break the technician guided-photo flow (E06-S02):

```typescript
  {
    id: 'ac-deep-clean-window',
    categoryId: 'ac-repair',
    name: 'AC Deep Clean (Window)',
    nameHi: 'विंडो एसी डीप क्लीन',
    shortDescription: 'Chemical wash and full service for window air conditioners.',
    shortDescriptionHi: 'विंडो एसी की केमिकल वॉश और पूरी सर्विस।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fac-deep-clean-window.jpg',
    basePrice: 69900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Chemical wash of coils and filter', 'Drain cleaning', 'Cooling performance check'],
    faq: [{ question: 'Is this different from split AC service?', answer: 'Yes — window units are serviced in place and take less time.' }],
    addOns: [],
    photoStages: [
      { id: 'before-unit', label: 'Window AC before service', required: true },
      { id: 'after-unit', label: 'Window AC after service', required: true },
    ],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
```

> The hero image does not exist in Firebase Storage yet. That is fine and intentional: `shouldRenderCdnImage` in `PhotoFirstImageResolver.kt` falls back to a text/icon card on a failed load. Photography is E22-S02 and must not block the reprice.

- [ ] **Step 7: Stop the seed re-activating what the owner switched off**

Still in `api/src/cosmos/seeds/catalogue.ts`, replace the two blind upsert loops.

The seed currently calls `items.upsert(svc)` with a full document, which reverts every admin change — including `isActive`. The owner has a toggle endpoint precisely to control activation, and a deploy must not silently undo it.

```typescript
  console.log('Seeding services...');
  for (const svc of SERVICES) {
    // E22-S01: the seed owns catalogue CONTENT (names, copy, price, includes,
    // photoStages). It does not own activation — the owner toggles that from the
    // dashboard, and a blind upsert of `isActive` would silently switch a service
    // the owner had turned off back on at every deploy.
    const existing = await svcContainer.item(svc.id, svc.categoryId).read<Service>()
      .then((r) => r.resource)
      .catch((err: unknown) => {
        if ((err as { code?: number }).code === 404) return undefined;
        throw err;
      });

    await svcContainer.items.upsert({
      ...svc,
      isActive: existing?.isActive ?? svc.isActive,
      createdAt: existing?.createdAt ?? svc.createdAt,
    });
    console.log(`  upserted: ${svc.id}${existing ? '' : ' (new)'}`);
  }
```

Apply the same shape to the `CATEGORIES` loop, reading via `catContainer.item(cat.id, cat.id)`.

- [ ] **Step 8: Run the tests to verify they pass**

```bash
cd api && npx vitest run tests/catalogue-seed.test.ts && npx tsc --noEmit
```

Expected: all green.

- [ ] **Step 9: Keep the id mirror in sync**

Add `'ac-deep-clean-window'` to `CATALOGUE_SERVICE_IDS` in `api/src/data/catalogue-ids.ts`, keeping the existing order. Without this the waitlist handler rejects the new service id.

- [ ] **Step 10: Commit**

```bash
git add api/src/cosmos/seeds/catalogue.ts api/src/data/catalogue-ids.ts api/tests/catalogue-seed.test.ts
git commit -m "feat(api): E22-S01 — apply owner reprice, add window AC, backfill Hindi, take prices out of prose"
```

---

## Task 4: CI guard so Hindi copy can never go missing

**Files:**
- Create: `tools/check-hindi-catalogue-parity.mjs`
- Modify: `.github/workflows/ship.yml` (api job)
- Test: exercised by running the script itself

**Interfaces:**
- Consumes: `CATEGORIES` / `SERVICES` from the seed and `HindiLocaleNames.kt`.
- Produces: a non-zero exit when a seeded entity lacks Hindi copy on either side.

- [ ] **Step 1: Write the guard**

```javascript
#!/usr/bin/env node
// E22-S01 — Fails CI when catalogue Hindi copy is missing.
//
// The customer app is Hindi-default (ADR-0018). A service added without Hindi
// renders an English label to every customer in Ayodhya, which is a visible
// product defect rather than a cosmetic one. Two sources must stay populated:
//
//   1. api/src/cosmos/seeds/catalogue.ts  — nameHi / shortDescriptionHi (server truth)
//   2. customer-app/.../HindiLocaleNames.kt — the compiled-in fallback for APKs
//      already in the field, which cannot receive the server fields.
//
// Run: node tools/check-hindi-catalogue-parity.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = resolve(root, 'api/src/cosmos/seeds/catalogue.ts');
const kotlinPath = resolve(
  root,
  'customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt',
);

const seed = readFileSync(seedPath, 'utf8');
const kotlin = readFileSync(kotlinPath, 'utf8');

const serviceIds = [...seed.matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
if (serviceIds.length === 0) {
  console.error('parity: could not parse any service ids from the seed — has its shape changed?');
  process.exit(1);
}

const failures = [];

for (const id of serviceIds) {
  if (!kotlin.includes(`"${id}" to `)) {
    failures.push(`${id}: missing from HindiLocaleNames.kt (old APKs will show English)`);
  }
}

// Every seeded service must carry server-side Hindi too.
const blocks = seed.split(/^\s{2}\{$/m);
for (const id of serviceIds) {
  const block = blocks.find((b) => b.includes(`id: '${id}'`));
  if (!block) continue;
  if (!/nameHi:/.test(block)) failures.push(`${id}: missing nameHi in the seed`);
  if (!/shortDescriptionHi:/.test(block)) failures.push(`${id}: missing shortDescriptionHi in the seed`);
}

// A price in prose goes stale the instant the owner edits the price.
for (const [, text] of seed.matchAll(/shortDescription(?:Hi)?: '([^']*)'/g)) {
  if (/[₹]|\bRs\.?\b|\bINR\b/.test(text)) {
    failures.push(`price found in a description: "${text}" — render it from basePrice instead`);
  }
}

if (failures.length > 0) {
  console.error('Hindi catalogue parity check FAILED:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Hindi catalogue parity OK — ${serviceIds.length} services.`);
```

- [ ] **Step 2: Run it and confirm it passes against Task 3's output**

```bash
node tools/check-hindi-catalogue-parity.mjs
```

Expected: `Hindi catalogue parity OK — 14 services.`

- [ ] **Step 3: Prove it actually catches a regression**

Temporarily delete one `nameHi:` line from the seed, re-run, confirm a non-zero exit and a named failure, then restore the line. A guard nobody has watched fail is not a guard.

- [ ] **Step 4: Wire it into CI**

Add a step to the api job in `.github/workflows/ship.yml`, before the test step:

```yaml
      - name: Hindi catalogue parity
        run: node tools/check-hindi-catalogue-parity.mjs
```

- [ ] **Step 5: Commit**

```bash
git add tools/check-hindi-catalogue-parity.mjs .github/workflows/ship.yml
git commit -m "ci: E22-S01 — fail the build when catalogue Hindi copy or price-in-prose regresses"
```

---

## Task 5: Admin can type both languages

**Files:**
- Modify: `admin-web/src/components/catalogue/ServiceForm.tsx`
- Modify: `admin-web/src/components/catalogue/CategoryForm.tsx`
- Modify: `admin-web/messages/en.json`, `admin-web/messages/hi.json`
- Modify: `admin-web/src/api/generated/*` (regenerated, not hand-edited)
- Test: `admin-web/tests/components/catalogue/ServiceForm.test.tsx`

**Interfaces:**
- Consumes: Task 2's OpenAPI contract.
- Produces: the edit payload gains `nameHi` and `shortDescriptionHi` alongside the six fields it already owns.

- [ ] **Step 1: Regenerate the typed client**

```bash
cd admin-web && pnpm openapi:client
git diff --stat src/api/generated/
```

Expected: `nameHi` / `shortDescriptionHi` appear in `schema.d.ts`. If they do not, Task 2 Step 4 was not completed.

- [ ] **Step 2: Write the failing test**

Append to `admin-web/tests/components/catalogue/ServiceForm.test.tsx`:

```typescript
describe('ServiceForm — bilingual fields (E22-S01)', () => {
  it('round-trips Hindi copy on edit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const withHindi = { ...existingService, nameHi: 'एसी डीप क्लीन', shortDescriptionHi: 'केमिकल वॉश।' } as AdminService;

    render(<ServiceForm categoryId="ac-repair" initial={withHindi} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(payload.nameHi).toBe('एसी डीप क्लीन');
    expect(payload.shortDescriptionHi).toBe('केमिकल वॉश।');
  });

  it('still omits the content arrays — P0-3 must not regress', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ServiceForm categoryId="ac-repair" initial={existingService} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    for (const field of CONTENT_FIELDS) {
      expect(field in payload).toBe(false);
    }
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd admin-web && npx vitest run tests/components/catalogue/ServiceForm.test.tsx
```

Expected: FAIL — `payload.nameHi` is `undefined`.

- [ ] **Step 4: Add the state and the payload fields**

In `ServiceForm.tsx`, beside the existing `name` / `shortDescription` state:

```typescript
  const [nameHi, setNameHi] = useState(initial?.nameHi ?? '');
  const [shortDescriptionHi, setShortDescriptionHi] = useState(initial?.shortDescriptionHi ?? '');
```

Extend the `edited` object added by P0-3 — **do not** reintroduce the content arrays:

```typescript
    const edited = {
      name,
      nameHi,
      shortDescription,
      shortDescriptionHi,
      heroImageUrl,
      basePrice: basePriceNum,
      commissionBps: commissionNum,
      durationMinutes: durationNum,
    };
```

> `nameHi` is `.min(1)` server-side, so an empty string is rejected. If the field is blank, omit the key rather than sending `''` — build `edited` and then `delete` the blank keys, or assemble conditionally.

- [ ] **Step 5: Add the inputs**

Place each Hindi field directly beneath its English counterpart so the pairing is obvious. Copy the surrounding `label`/`input` markup and its inline style objects verbatim from the existing `svc-name` block — this form styles inline rather than with classes, so an imported style would not match. Insert after the name field:

```tsx
      <div>
        <label htmlFor="svc-name-hi" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.nameHiLabel')}
        </label>
        <input
          id="svc-name-hi"
          lang="hi"
          value={nameHi}
          onChange={(e) => setNameHi(e.target.value)}
          placeholder={t('serviceForm.nameHiPlaceholder')}
          style={{ width: '100%', padding: 'var(--space-2)' }}
        />
      </div>
```

Match the `style` object to whatever the neighbouring inputs actually use rather than the abbreviated one above. Repeat for `svc-desc-hi` bound to `shortDescriptionHi`, using `serviceForm.descriptionHiLabel` / `descriptionHiPlaceholder`.

New i18n keys in both `en.json` and `hi.json` under `catalogue.serviceForm`:

```json
"nameHiLabel": "Name (Hindi)",
"nameHiPlaceholder": "एसी डीप क्लीन",
"descriptionHiLabel": "Short description (Hindi)",
"descriptionHiPlaceholder": "केमिकल वॉश, गैस चेक, फिल्टर सफाई।"
```

Add `nameHiLabel` / `nameHiPlaceholder` under `catalogue.form` for `CategoryForm.tsx` and wire the same way.

- [ ] **Step 6: Run the tests and the web gate**

```bash
cd admin-web && npx vitest run tests/components/catalogue/
cd .. && bash tools/pre-codex-smoke-web.sh
```

Expected: PASS, ESLint 0 warnings.

- [ ] **Step 7: Commit**

```bash
git add admin-web/
git commit -m "feat(admin-web): E22-S01 — edit catalogue names and descriptions in Hindi"
```

---

## Task 6: Customer app prefers server Hindi, keeps the compiled map as fallback

**Files:**
- Modify: `customer-app/.../data/catalogue/remote/dto/ServiceDto.kt`
- Modify: `customer-app/.../data/catalogue/remote/dto/CategoryDto.kt`
- Modify: `customer-app/.../domain/catalogue/model/Service.kt`, `Category.kt`
- Modify: `customer-app/.../domain/catalogue/CatalogueLocalizer.kt`
- Modify: `customer-app/.../data/catalogue/HindiLocaleNames.kt`
- Test: `customer-app/.../test/.../CatalogueLocalizerTest.kt`

**Interfaces:**
- Consumes: Task 2's wire shape.
- Produces: `Service` / `Category` domain models carry `nameHi: String?` and `descriptionHi: String?`; `CatalogueLocalizer` resolves server → compiled map → English.

**This task is not a blocker for the reprice.** Prices are served from `basePrice` and already reach every installed APK. This task is what stops *future* catalogue additions being English-only.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.domain.catalogue.model.Service
import org.junit.Assert.assertEquals
import org.junit.Test

public class CatalogueLocalizerHindiSourceTest {
    private val localizer = CatalogueLocalizer()

    private fun service(
        id: String,
        nameHi: String? = null,
        descriptionHi: String? = null,
    ) = Service(
        id = id,
        categoryId = "ac-repair",
        name = "AC Deep Clean",
        description = "Chemical wash.",
        nameHi = nameHi,
        descriptionHi = descriptionHi,
        basePrice = 99900,
        durationMinutes = 90,
        imageUrl = "",
        includes = emptyList(),
        addOns = emptyList(),
    )

    @Test
    public fun `server Hindi wins over the compiled map`() {
        val result = localizer.localizeService(service("ac-deep-clean", nameHi = "सर्वर नाम"), "hi")
        assertEquals("सर्वर नाम", result.name)
    }

    @Test
    public fun `falls back to the compiled map when the server sends no Hindi`() {
        val result = localizer.localizeService(service("ac-deep-clean"), "hi")
        assertEquals("एसी डीप क्लीन", result.name)
    }

    // The whole point of the story: a service added via the dashboard after this
    // APK shipped has no compiled-in entry, and must still render in Hindi.
    @Test
    public fun `a service unknown to the compiled map still renders server Hindi`() {
        val result = localizer.localizeService(service("brand-new-service", nameHi = "नई सेवा"), "hi")
        assertEquals("नई सेवा", result.name)
    }

    @Test
    public fun `falls back to English when neither source has Hindi`() {
        val result = localizer.localizeService(service("brand-new-service"), "hi")
        assertEquals("AC Deep Clean", result.name)
    }

    @Test
    public fun `English locale is untouched even when server Hindi exists`() {
        val result = localizer.localizeService(service("ac-deep-clean", nameHi = "सर्वर नाम"), "en")
        assertEquals("AC Deep Clean", result.name)
    }
}
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*CatalogueLocalizerHindiSourceTest*"
```

Expected: compilation failure — `Service` has no `nameHi`.

- [ ] **Step 3: Add the fields to the DTOs and both mappers**

Nullable with a default, so APKs deserialising an older response still work. Add the same two lines as the last constructor parameters of **both** `ServiceCardDto` and `ServiceDto`:

```kotlin
    @Json(name = "nameHi") public val nameHi: String? = null,
    @Json(name = "shortDescriptionHi") public val shortDescriptionHi: String? = null,
```

Then carry them through both `toDomain()` mappers. `ServiceCardDto.toDomain()` becomes:

```kotlin
public fun ServiceCardDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Service =
    com.homeservices.customer.domain.catalogue.model.Service(
        id = id,
        categoryId = categoryId,
        name = name,
        description = shortDescription,
        nameHi = nameHi,
        descriptionHi = shortDescriptionHi,
        basePrice = basePrice,
        durationMinutes = durationMinutes,
        imageUrl = heroImageUrl,
        includes = emptyList(),
        addOns = emptyList(),
    )
```

`ServiceDto.toDomain()` takes the identical two additions (`nameHi = nameHi`, `descriptionHi = shortDescriptionHi`), leaving its `includes` / `addOns` mapping untouched.

For the category, add `@Json(name = "nameHi") public val nameHi: String? = null` to the DTO in `CategoryDto.kt` and pass `nameHi = nameHi` in its `toDomain()`.

> The domain model calls it `descriptionHi` while the wire calls it `shortDescriptionHi`. That mirrors the existing `description = shortDescription` mapping — do not rename either side to match the other.

- [ ] **Step 4: Add the fields to the domain models**

`Service` gains `nameHi: String? = null` and `descriptionHi: String? = null`; `Category` gains `nameHi: String? = null`.

- [ ] **Step 5: Make the localizer three-level**

```kotlin
        public fun localizeService(
            service: Service,
            locale: String,
        ): Service =
            if (locale.startsWith("hi")) {
                // E22-S01 three-level fallback:
                //   1. server nameHi        — reaches customers with no app release
                //   2. compiled-in map      — keeps APKs in the field working
                //   3. English              — better than a blank label
                service.copy(
                    name = service.nameHi
                        ?: HindiLocaleNames.serviceHindiNames[service.id]
                        ?: service.name,
                    description = service.descriptionHi
                        ?: HindiLocaleNames.serviceShortDescriptionsHindi[service.id]
                        ?: service.description,
                )
            } else {
                service
            }
```

Apply the same shape to `localizeCategory`.

- [ ] **Step 6: Take the prices out of the compiled Hindi map**

In `HindiLocaleNames.kt`, replace the two entries carrying a figure with the same wording used in the seed:

```kotlin
"ac-deep-clean" to "केमिकल वॉश, गैस चेक, फिल्टर सफाई — सब कुछ शामिल।",
"water-pump-repair" to "सरफेस + सबमर्सिबल पंप की जाँच और मरम्मत — सब कुछ शामिल।",
```

Add the `ac-deep-clean-window` entries to both maps so the parity guard passes.

- [ ] **Step 7: Run the tests and the Android gate**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*CatalogueLocalizer*"
cd .. && bash tools/pre-codex-smoke.sh customer-app
```

Expected: PASS. Use `-PexcludePaparazzi` on Windows per `docs/patterns/paparazzi-cross-os-goldens.md`; never record goldens locally.

- [ ] **Step 8: Commit**

```bash
git add customer-app/
git commit -m "feat(customer-app): E22-S01 — prefer server Hindi, keep compiled map as fallback"
```

---

## Task 7: Gates and review

- [ ] **Step 1: Run every gate**

```bash
node tools/check-hindi-catalogue-parity.mjs
bash tools/pre-codex-smoke-api.sh
bash tools/pre-codex-smoke-web.sh
bash tools/pre-codex-smoke.sh customer-app
```

All four must pass before review.

- [ ] **Step 2: Codex review**

```bash
codex review --base main -c 'sandbox_permissions=["disk-full-read-access"]'
```

Fix findings in one round, re-run once, then write `.codex-review-passed` recording both rounds. Do not iterate further — escalate instead.

- [ ] **Step 3: Push and open the PR**

The PR description must state plainly that this changes live customer prices, and list the table from Task 3.

---

## Task 8: Production reprice — human-gated, do not automate

**Do not run this as part of execution.** Bring it to the owner.

- [ ] **Step 1: Deploy the API first, then admin-web, then seed**

The seed writes documents carrying `nameHi`; the deployed API must already accept and serve those fields, or the strict schemas will reject reads. Merge, let `api-ship.yml` deploy, confirm `/api/v1/health` reports the new commit. admin-web must not ship before the API because its create/update request bodies are `.strict()` and would 400 on `nameHi` against the old API; the customer-app release is independent of this deploy order and can ship on its own schedule.

- [ ] **Step 2: Dry-run against a non-production database if one exists**

Otherwise read the seed diff aloud with the owner, price by price, against the handwritten notes.

- [ ] **Step 3: Capture the current prices — and everything else the seed will reset — before overwriting them**

```bash
# Record what production currently charges (and every other field the seed
# does not preserve), so the change is reversible.
npx tsx -e "
import { CosmosClient } from '@azure/cosmos';
const c = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
const { resources } = await c.database('homeservices').container('services')
  .items.query('SELECT c.id, c.basePrice, c.commissionBps, c.isActive, c.safetyTag, c.workStart, c.workEnd FROM c').fetchAll();
console.log(JSON.stringify(resources, null, 2));
" > /tmp/services-before-e22-s01.json

npx tsx -e "
import { CosmosClient } from '@azure/cosmos';
const c = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
const { resources } = await c.database('homeservices').container('categories')
  .items.query('SELECT c.id, c.commissionBps, c.isActive, c.safetyTag FROM c').fetchAll();
console.log(JSON.stringify(resources, null, 2));
" > /tmp/categories-before-e22-s01.json
```

**Callout — the seed resets these fields on every run.** `mergeSeedDoc` (`api/src/cosmos/seed-merge.ts`) preserves only `isActive` and `createdAt`; every other field is overwritten from the seed's hardcoded values. That means the seed run silently resets: service `commissionBps`, category `commissionBps` (the seed has none for categories, so this is deleted), category `safetyTag`, and service `workStart`/`workEnd`. These two capture files must be read aloud to the owner alongside the price table before the seed runs, so any owner-set value in these fields is either accepted as lost or re-applied by hand afterward.

- [ ] **Step 4: Run the seed**

```bash
cd api && npx tsx src/cosmos/seeds/catalogue.ts
```

- [ ] **Step 5: Verify on the real surfaces**

- `GET /v1/categories` returns the new prices and `nameHi`.
- The admin catalogue list shows the new prices.
- A Hindi-locale customer-app build shows Hindi names and **no stale rupee figure** in any description.
- Confirm a service the owner had deactivated is still deactivated (Task 3 Step 7).

- [ ] **Step 6: Watch the first bookings**

Confirm the first booking after the reprice records the intended `amount`, and that its commission receivable is raised against the new figure.

- [ ] **Step 7: Operational notes**

The seed's two loops (categories, then services) are sequential read-then-upsert with no ETag / optimistic-concurrency check. A failure partway through — network blip, a 429, the process being killed — leaves a mixed catalogue: some documents already on the new content, others still on the old. The seed is idempotent, so the fix is simply to re-run it, then verify all 14 prices against the price table again. Run this during a quiet window with the owner off the admin dashboard, so a concurrent dashboard edit (price, activation) does not race the seed's read-then-upsert and get silently overwritten.

---

## Verification

| What | How | Expected |
|---|---|---|
| Prices match the owner's notes | `npx vitest run tests/catalogue-seed.test.ts` | 14 price assertions pass |
| No price in prose, either language | parity guard + seed tests | exit 0 |
| Hindi reaches the card, not just the detail | `catalogue-bilingual.test.ts` | `ServiceCardSchema` carries `nameHi` |
| A dashboard-added service renders in Hindi with no APK | `CatalogueLocalizerHindiSourceTest` | server Hindi wins for an id absent from the map |
| Old APKs still work | DTO fields nullable with defaults | compiled map still resolves |
| P0-3 has not regressed | `ServiceForm.test.tsx` | content arrays still absent from the edit payload |
| Owner's activation toggles survive a deploy | seed reads existing `isActive` | a deactivated service stays deactivated |

## Risks

1. **This changes what customers pay.** Three services drop by more than half. The owner confirmed each; Task 8 Step 3 captures the previous prices so it is reversible.
2. **The seed overwrites admin edits by design.** Only `isActive` and `createdAt` are preserved. Any price the owner set in the dashboard between deploys is reverted by the next seed run. Say this out loud to the owner.
3. **`ServiceCardSchema` is a `.pick()`.** Forgetting Task 1 Step 4 produces a build where Hindi works on the detail screen and silently fails on the home screen — the most-viewed surface.
4. **`nameHi` is `.min(1)`.** An empty string from the admin form is a 400, not a no-op. Omit blank keys.
5. **Hero image for the window AC does not exist yet.** Intentional; the card degrades to text. Do not block on it, and do not invent a URL that 404s to something else.
6. **A Hindi field cannot be cleared from the dashboard once set (blank = omit = preserve).** Deferred to E22-S02.

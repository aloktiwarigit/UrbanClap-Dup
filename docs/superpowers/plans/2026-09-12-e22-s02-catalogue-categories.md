# E22-S02 — New Categories + Hero Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close E22-S02 — add the one remaining wave-map catalogue item (Inverter Install & Service), and replace the reused placeholder hero images from PR #346 with real, correctly-matched, free-license photos, fixing the Firebase Storage URL format so they actually render.

**Architecture:** `api/src/cosmos/seeds/catalogue.ts` stays the single source of truth for catalogue content (per the existing E22-S01 seed-ownership contract — the seed owns content, never `isActive`). This story only adds data to that seed, mirrors it into the Kotlin Hindi fallback map, and populates the previously-empty Firebase Storage paths those `heroImageUrl` fields point at. No schema changes, no new endpoints, no new UI.

**Tech Stack:** Node 22 + TypeScript + Zod (existing `ServiceSchema`/`ServiceCategorySchema`), Vitest, Firebase Storage Rules + `gcloud storage` CLI (already authenticated as the project owner — no new credentials needed), Kotlin (compiled-in Hindi fallback map).

**Spec:** No separate spec doc — this is a Feature-tier story per the owner's own wave map (`~/.claude/plans/act-as-a-principal-ticklish-fern.md`, "Wave 1 → E22-S02"). Brainstorm was done inline with the owner this session; scope decisions below are already confirmed.

## Global Constraints

- **No price may appear in prose.** Enforced by `PRICE_IN_PROSE` (`api/src/schemas/service.ts:20`) — checked by `api/tests/catalogue-seed.test.ts` against every seeded field. The Inverter entry's `name`, `nameHi`, `shortDescription`, `shortDescriptionHi`, `faq`, `addOns`, `includes` must contain no `₹`/`Rs`/`INR`/Hindi rupee words.
- **Hindi is mandatory on every service and category** (ADR-0018, customer-app is Hindi-default). `nameHi` + `shortDescriptionHi` in the seed, plus matching entries in all three `HindiLocaleNames.kt` maps, verified by `tools/check-hindi-catalogue-parity.mjs` — exact string equality between seed and Kotlin, checked by that script.
- **Unpriced/uncovered services stay `isActive: false`.** `tests/scripts/seed-technicians.test.ts` enforces a ≥2-online-technician launch gate per active service/category; no technician can self-select the Inverter skill yet (that needs a `technician-app` `ServiceCatalogue.kt` change, out of scope here), so the new service and its category (if not already active) stay inactive, exactly like PR #346's four entries.
- **₹0 infra.** No paid image API, no paid stock-photo tier. Only Pexels/Unsplash free-tier (commercial-use, no-attribution) images verified by a direct `curl` 200 + `image/*` content-type — never an Unsplash+ / Getty-licensed image.
- **Money is integer paise.** `₹499` is `49900`.
- **Scope boundary:** this story touches only the 6 catalogue entries listed in Task 2 (the `appliance-repair` category, its 3 PR #346 services, `electrical-camera-installation`, and the new Inverter service). It does **not** touch the other ~14 pre-existing categories/services that share the same broken bucket URL — that is a separate, larger backlog item (see Task 7).

---

## Background: two defects found during brainstorming (read before starting)

1. **Wrong bucket.** Every `heroImageUrl` in the seed points at `firebasestorage.googleapis.com/v0/b/homeservices-mvp/...`. The real, currently-configured Firebase project is `homeservices-prod-001` (bucket `homeservices-prod-001.firebasestorage.app` — confirmed from `customer-app/app/google-services.json`). `homeservices-mvp` returns 404 for every path.
2. **Missing `?alt=media`.** Even pointed at the right bucket, a bare `v0/b/<bucket>/o/<path>` URL returns Firebase Storage's JSON object-metadata, not image bytes — `Coil`/`AsyncImage` would fail to decode it as an image either way. The URL must end in `?alt=media`.
3. **No objects exist yet.** `gcloud storage ls gs://homeservices-prod-001.firebasestorage.app/` shows only `bookings/` and `reports/` — there has never been a `categories/` or `services/` prefix. This is why `docs/design/_inventory/C2.json` already flagged that every catalogue card silently falls back to its initials-tile fallback in production.

This plan fixes both, for the 6 entries in scope, and uploads real images so they actually render.

**Sourced images (verified via `curl -sI`, all `200` / `image/jpeg`, Pexels free license — no attribution required, commercial use OK):**

| Target | Direct URL | Note |
|---|---|---|
| `categories/appliance-repair.jpg` | `https://images.pexels.com/photos/38190070/pexels-photo-38190070.jpeg` | Technician opening an appliance panel with a cordless drill — generic, on-topic category hero. |
| `services/appliance-fridge-repair.jpg` | `https://images.pexels.com/photos/32391499/pexels-photo-32391499.jpeg` | Technicians servicing a chest-freezer/fridge unit. |
| `services/appliance-cooler-service.jpg` | *(same file as the category image above)* | **No real desert/room-air-cooler photo exists on Pexels or Unsplash's free tiers** — searched both; closest Unsplash matches are Unsplash+ (paid, Getty-licensed), which is off-limits under the ₹0 constraint. Reusing the category's generic appliance-service photo is an honest "no specific photo available" placeholder, not a wrong-service photo like the current AC-clean reuse. Flag in the commit message; a real cooler photo is a candidate for Task 7's backlog. |
| `services/appliance-washing-machine-repair.jpg` | `https://images.pexels.com/photos/34734504/pexels-photo-34734504.jpeg` | Technician working on a front-loading appliance's control/wiring panel — plausibly a washing machine. Background has a Russian-language wall sign (unrelated equipment-care notice); acceptable as background clutter, not overlaid text, and not legible at hero-card thumbnail size. |
| `services/electrical-camera-installation.jpg` | `https://images.pexels.com/photos/207574/pexels-photo-207574.jpeg` | CCTV camera mounted on an exterior wall bracket. |
| `services/appliance-inverter-service.jpg` | `https://images.pexels.com/photos/37929911/pexels-photo-37929911.jpeg` | Clean product shot of a home inverter + battery bank installation, no logos/people. |

---

### Task 1: Add public-read Storage Rules for catalogue images

**Files:**
- Modify: `firebase/storage.rules`

**Interfaces:**
- Produces: a `categories/{file}` and `services/{file}` match block allowing anonymous read, so the app can load hero images via the plain `firebasestorage.googleapis.com/v0/b/.../o/...?alt=media` URL without a signed URL or auth token.

- [ ] **Step 1: Add the rule**

Add this block inside `service firebase.storage { match /b/{bucket}/o { ... } }`, next to the existing `kyc`/`bookings`/`sos-audio` blocks:

```
    // Catalogue hero images — category and service photos shown to every customer
    // on the home screen and service list. No PII, so these are the only two
    // public-read paths in this ruleset. Writes go through the Admin SDK / gcloud
    // (bypasses rules) during catalogue seeding, never from a client.
    match /categories/{file} {
      allow read: if true;
    }
    match /services/{file} {
      allow read: if true;
    }
```

- [ ] **Step 2: Validate the rules**

Run (via the Firebase MCP tool, or `firebase deploy --only storage --dry-run` if unavailable): validate `type: "storage"`, `source_file: "firebase/storage.rules"`. Expected: no syntax errors.

- [ ] **Step 3: Deploy**

```bash
firebase deploy --only storage
```

Expected: `✔ Deploy complete!` referencing `homeservices-prod-001`.

**This step touches production Firebase config — confirm with the owner before running `firebase deploy` if this plan is executed unattended.**

- [ ] **Step 4: Commit**

```bash
git add firebase/storage.rules
git commit -m "feat(firebase): allow public read on catalogue hero image paths"
```

---

### Task 2: Upload the 6 real hero images to the correct bucket

**Files:** none (infra step — no repo files change here; images land in Firebase Storage, referenced by URL in Task 3)

**Interfaces:**
- Produces: 6 objects in `gs://homeservices-prod-001.firebasestorage.app/` at the paths listed in the background table above, each publicly readable per Task 1's rules.

- [ ] **Step 1: Download the 6 verified source images**

```bash
mkdir -p .tmp-catalogue-hero
curl -sL -o .tmp-catalogue-hero/appliance-repair.jpg "https://images.pexels.com/photos/38190070/pexels-photo-38190070.jpeg"
curl -sL -o .tmp-catalogue-hero/appliance-fridge-repair.jpg "https://images.pexels.com/photos/32391499/pexels-photo-32391499.jpeg"
curl -sL -o .tmp-catalogue-hero/appliance-washing-machine-repair.jpg "https://images.pexels.com/photos/34734504/pexels-photo-34734504.jpeg"
curl -sL -o .tmp-catalogue-hero/electrical-camera-installation.jpg "https://images.pexels.com/photos/207574/pexels-photo-207574.jpeg"
curl -sL -o .tmp-catalogue-hero/appliance-inverter-service.jpg "https://images.pexels.com/photos/37929911/pexels-photo-37929911.jpeg"
cp .tmp-catalogue-hero/appliance-repair.jpg .tmp-catalogue-hero/appliance-cooler-service.jpg
ls -la .tmp-catalogue-hero/
```

Expected: 6 `.jpg` files, each a few hundred KB to a few MB (matches the `curl -w '%{size_download}'` sizes verified during sourcing: 1.05MB / 795KB / 1.05MB(dup) / 2.25MB / 1.38MB / 4.13MB).

- [ ] **Step 2: Upload to the real bucket**

```bash
gcloud storage cp .tmp-catalogue-hero/appliance-repair.jpg gs://homeservices-prod-001.firebasestorage.app/categories/appliance-repair.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
gcloud storage cp .tmp-catalogue-hero/appliance-fridge-repair.jpg gs://homeservices-prod-001.firebasestorage.app/services/appliance-fridge-repair.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
gcloud storage cp .tmp-catalogue-hero/appliance-cooler-service.jpg gs://homeservices-prod-001.firebasestorage.app/services/appliance-cooler-service.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
gcloud storage cp .tmp-catalogue-hero/appliance-washing-machine-repair.jpg gs://homeservices-prod-001.firebasestorage.app/services/appliance-washing-machine-repair.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
gcloud storage cp .tmp-catalogue-hero/electrical-camera-installation.jpg gs://homeservices-prod-001.firebasestorage.app/services/electrical-camera-installation.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
gcloud storage cp .tmp-catalogue-hero/appliance-inverter-service.jpg gs://homeservices-prod-001.firebasestorage.app/services/appliance-inverter-service.jpg --content-type=image/jpeg --cache-control="public, max-age=604800"
```

**This uploads to the live production Storage bucket — confirm with the owner before running if this plan is executed unattended.**

- [ ] **Step 3: Verify each object is publicly readable**

```bash
for p in "categories%2Fappliance-repair.jpg" "services%2Fappliance-fridge-repair.jpg" "services%2Fappliance-cooler-service.jpg" "services%2Fappliance-washing-machine-repair.jpg" "services%2Felectrical-camera-installation.jpg" "services%2Fappliance-inverter-service.jpg"; do
  echo "=== $p ==="
  curl -s -o /dev/null -w "status=%{http_code} type=%{content_type}\n" "https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/$p?alt=media"
done
```

Expected: all 6 lines show `status=200 type=image/jpeg`. If any shows `403`, Task 1's rules deploy did not complete — re-run Task 1 Step 3 before continuing.

- [ ] **Step 4: Clean up local staging files (not committed)**

```bash
rm -rf .tmp-catalogue-hero
git status --short
```

Expected: clean — no untracked files from this task.

---

### Task 3: Fix `heroImageUrl` bucket/format on the 5 existing E22 entries + add the Inverter service

**Files:**
- Modify: `api/src/cosmos/seeds/catalogue.ts`
- Test: `api/tests/catalogue-seed.test.ts`

**Interfaces:**
- Consumes: nothing new — same `ServiceCategory`/`Service` types already imported in the seed file.
- Produces: `SERVICES` gains one new entry, `id: 'appliance-inverter-service'`; 6 `heroImageUrl` values change from the `homeservices-mvp` bucket (no `alt=media`) to `homeservices-prod-001.firebasestorage.app` (with `?alt=media`).

- [ ] **Step 1: Write the failing tests**

Add to `api/tests/catalogue-seed.test.ts`, inside the top `describe('catalogue seed canonical category set (Ayodhya pilot)', ...)` block:

```typescript
  it('contains the new inverter service, inactive pending technician coverage', () => {
    const byId = new Map(SERVICES.map(s => [s.id, s]));
    expect(byId.has('appliance-inverter-service')).toBe(true);
    const inverter = byId.get('appliance-inverter-service')!;
    expect(inverter.categoryId).toBe('appliance-repair');
    expect(inverter.basePrice).toBe(49900);
    expect(inverter.isActive, 'appliance-inverter-service must stay inactive until a technician holds this skill').toBe(false);
  });

  it('E22-S02: appliance-repair category and its services point at the real Storage bucket with alt=media', () => {
    const APPLIANCE_SERVICE_IDS = [
      'appliance-fridge-repair',
      'appliance-cooler-service',
      'appliance-washing-machine-repair',
      'electrical-camera-installation',
      'appliance-inverter-service',
    ];
    const applianceCategory = CATEGORIES.find(c => c.id === 'appliance-repair')!;
    expect(applianceCategory.heroImageUrl).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/homeservices-prod-001\.firebasestorage\.app\/o\/.+\?alt=media$/);
    expect(applianceCategory.heroImageUrl).not.toContain('homeservices-mvp');

    const byId = new Map(SERVICES.map(s => [s.id, s]));
    for (const id of APPLIANCE_SERVICE_IDS) {
      const svc = byId.get(id)!;
      expect(svc.heroImageUrl, `${id} heroImageUrl`).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/homeservices-prod-001\.firebasestorage\.app\/o\/.+\?alt=media$/);
      expect(svc.heroImageUrl, `${id} heroImageUrl must not use the dead homeservices-mvp bucket`).not.toContain('homeservices-mvp');
    }

    // Each service must point at its OWN storage path, not a borrowed sibling's —
    // this was the exact PR #346 gap for electrical-camera-installation, which
    // pointed at services%2Felectrical-switchboard-fix.jpg instead of its own id.
    for (const id of ['appliance-fridge-repair', 'appliance-cooler-service', 'appliance-washing-machine-repair', 'electrical-camera-installation', 'appliance-inverter-service']) {
      const svc = byId.get(id)!;
      expect(svc.heroImageUrl, `${id} must reference its own object path`).toContain(encodeURIComponent(`services/${id}.jpg`));
    }
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd api && pnpm vitest run tests/catalogue-seed.test.ts
```

Expected: `appliance-inverter-service` test fails ("expected false to be true" — no such id exists yet), and the bucket-format test fails (still contains `homeservices-mvp`).

- [ ] **Step 3: Fix the 5 existing `heroImageUrl` values**

In `api/src/cosmos/seeds/catalogue.ts`, update the `appliance-repair` category (currently line 22) and the 4 services (currently in the "Appliance Repair — added 2026-09-12" block, lines ~311-393):

```typescript
  // 2026-09-12: isActive:false — tests/scripts/seed-technicians.test.ts enforces a
  // >=2-online-technician launch gate per active category/service, and no technician
  // can hold an appliance-repair skill until technician-app ships ServiceCatalogue.kt
  // self-select.
  // 2026-09-12 (E22-S02): heroImageUrl corrected from the dead `homeservices-mvp`
  // bucket (never existed — see docs/superpowers/plans/2026-09-12-e22-s02-catalogue-categories.md)
  // to the real `homeservices-prod-001.firebasestorage.app` bucket, with the
  // required `?alt=media` suffix Firebase Storage needs to serve raw image bytes
  // instead of JSON object metadata.
  { id: 'appliance-repair', name: 'Appliance Repair', nameHi: 'उपकरण मरम्मत', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/categories%2Fappliance-repair.jpg?alt=media', sortOrder: 6, isActive: false, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
```

And in the `SERVICES` array, change each of the 4 `heroImageUrl` values:

```typescript
  {
    id: 'appliance-fridge-repair',
    ...
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-fridge-repair.jpg?alt=media',
    ...
  },
  {
    id: 'appliance-cooler-service',
    ...
    // E22-S02: no free-license photo of an Indian desert/room air cooler exists on
    // Pexels or Unsplash's non-paid tiers (searched both) — reuses the category's
    // generic appliance-service photo rather than an unrelated one. Real cooler
    // photography is a candidate for the Task 7 backlog item.
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-cooler-service.jpg?alt=media',
    ...
  },
  {
    id: 'appliance-washing-machine-repair',
    ...
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-washing-machine-repair.jpg?alt=media',
    ...
  },
  ...
  {
    id: 'electrical-camera-installation',
    ...
    // E22-S02: PR #346 pointed this at the borrowed services%2Felectrical-switchboard-fix.jpg
    // path. Corrected to its own object.
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Felectrical-camera-installation.jpg?alt=media',
    ...
  },
```

(Leave every other field on these 5 entries untouched — only `heroImageUrl` and the category's comment block change.)

- [ ] **Step 4: Add the new Inverter service**

Append to the end of the `SERVICES` array, after the `electrical-camera-installation` entry:

```typescript
  {
    id: 'appliance-inverter-service',
    categoryId: 'appliance-repair',
    name: 'Inverter Install & Service',
    nameHi: 'इन्वर्टर इंस्टॉलेशन और सर्विस',
    shortDescription: 'Installation, battery check, and servicing for home inverters and UPS units.',
    shortDescriptionHi: 'घरेलू इन्वर्टर और यूपीएस की इंस्टॉलेशन, बैटरी जांच और सर्विसिंग।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-inverter-service.jpg?alt=media',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Inverter + battery inspection', 'Wiring and connection check', 'Test run under load'],
    faq: [{ question: 'Is a new battery included?', answer: 'No — a replacement battery is a separate add-on if the existing one fails the load test.' }],
    addOns: [{ id: 'battery-replacement', name: 'Battery replacement', price: 350000, triggerCondition: 'if the existing battery fails the load test' }],
    photoStages: [{ id: 'inverter-before', label: 'Inverter/battery before service', required: true }, { id: 'inverter-after', label: 'After service', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd api && pnpm vitest run tests/catalogue-seed.test.ts
```

Expected: all tests pass, including the two added in Step 1.

- [ ] **Step 6: Commit**

```bash
git add api/src/cosmos/seeds/catalogue.ts api/tests/catalogue-seed.test.ts
git commit -m "feat(api): add Inverter service, fix catalogue hero image bucket URLs"
```

---

### Task 4: Register the Inverter service in `catalogue-ids.ts`

**Files:**
- Modify: `api/src/data/catalogue-ids.ts`
- Test: `api/tests/catalogue-seed.test.ts` (extend existing coverage, or a new small assertion)

**Interfaces:**
- Consumes: `SERVICES` from `api/src/cosmos/seeds/catalogue.ts` (Task 3).
- Produces: `CATALOGUE_SERVICE_IDS` includes `'appliance-inverter-service'`, so the waitlist handler (`api/src/functions/waitlist.ts` or wherever `CATALOGUE_SERVICE_IDS` is consumed) recognises it.

- [ ] **Step 1: Write the failing test**

Add to `api/tests/catalogue-seed.test.ts`:

```typescript
  it('every seeded service id is registered in catalogue-ids.ts (waitlist handler contract)', async () => {
    const { CATALOGUE_SERVICE_IDS } = await import('../src/data/catalogue-ids.js');
    const registered = new Set(CATALOGUE_SERVICE_IDS);
    for (const s of SERVICES) {
      expect(registered.has(s.id), `${s.id} missing from catalogue-ids.ts`).toBe(true);
    }
  });
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd api && pnpm vitest run tests/catalogue-seed.test.ts -t "catalogue-ids"
```

Expected: FAIL — `appliance-inverter-service missing from catalogue-ids.ts`.

- [ ] **Step 3: Add the id**

In `api/src/data/catalogue-ids.ts`, append to the `CATALOGUE_SERVICE_IDS` array (after `'electrical-camera-installation'`):

```typescript
  'appliance-inverter-service',
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd api && pnpm vitest run tests/catalogue-seed.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/data/catalogue-ids.ts api/tests/catalogue-seed.test.ts
git commit -m "chore(api): register appliance-inverter-service in catalogue-ids"
```

---

### Task 5: Hindi parity for the Inverter service

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt`

**Interfaces:**
- Consumes: `nameHi` / `shortDescriptionHi` already written into the seed in Task 3 — must be byte-identical here (the parity checker does exact string equality).
- Produces: `serviceHindiNames` and `serviceShortDescriptionsHindi` both gain an `"appliance-inverter-service" to "..."` entry. `categoryHindiNames` needs no change — `appliance-repair` is already present from PR #346.

- [ ] **Step 1: Add the two Kotlin entries**

In `HindiLocaleNames.kt`, append to `serviceHindiNames` (after `"electrical-camera-installation" to "सीसीटीवी कैमरा इंस्टॉलेशन",`):

```kotlin
            "appliance-inverter-service" to "इन्वर्टर इंस्टॉलेशन और सर्विस",
```

And to `serviceShortDescriptionsHindi` (after the matching `electrical-camera-installation` line):

```kotlin
            "appliance-inverter-service" to "घरेलू इन्वर्टर और यूपीएस की इंस्टॉलेशन, बैटरी जांच और सर्विसिंग।",
```

**These two Hindi strings must be copy-pasted exactly from Task 3's seed entry — the parity checker does exact string equality, not a fuzzy match.**

- [ ] **Step 2: Run the parity checker**

```bash
node tools/check-hindi-catalogue-parity.mjs
```

Expected: `Hindi catalogue parity OK — 19 services.` (18 existing + the new Inverter service). If it fails, the error names exactly which string differs and how (seed vs Kotlin) — fix the mismatch, don't reword either side to "fix" it.

- [ ] **Step 3: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt
git commit -m "feat(customer-app): add Hindi fallback strings for Inverter service"
```

---

### Task 6: Verify images render end-to-end and run the full API smoke gate

**Files:** none (verification task)

- [ ] **Step 1: Re-run the Hindi parity check and full API test suite**

```bash
node tools/check-hindi-catalogue-parity.mjs
cd api && pnpm vitest run
```

Expected: parity OK; all tests green.

- [ ] **Step 2: Re-verify the 6 image URLs one more time against the seed's exact strings**

```bash
grep -oE "https://firebasestorage\.googleapis\.com/v0/b/homeservices-prod-001\.firebasestorage\.app/o/[^']+" api/src/cosmos/seeds/catalogue.ts | sort -u | while read -r url; do
  echo "=== $url ==="
  curl -s -o /dev/null -w "status=%{http_code} type=%{content_type}\n" "$url"
done
```

Expected: 6 distinct URLs listed (5 service paths + 1 category path — `appliance-cooler-service` and `appliance-repair` are different objects even though their bytes are duplicates), every one `status=200 type=image/jpeg`.

- [ ] **Step 3: Run the pre-Codex smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```

Expected: exit 0. If non-zero, stop and fix before continuing — do not invoke Codex on a failing smoke gate.

---

### Task 7: Note the backlog gap for the other pre-existing catalogue images

**Files:**
- Modify: `~/.claude/plans/act-as-a-principal-ticklish-fern.md` (append a note under the E22-S02 section — this is the owner's own live wave-map doc, not a repo file)

**Interfaces:** none — documentation only.

- [ ] **Step 1: Append the finding**

Add a short note under the existing "E22-S02 · New categories + hero images" section:

```markdown
**2026-09-12 update:** E22-S02 also uncovered that the SAME `homeservices-mvp`
bucket bug (dead bucket name + missing `?alt=media`) affects all ~14 pre-existing
categories/services (AC Repair, Water Pump, Plumbing, Electrical, RO, etc.) —
none of them have ever rendered a real photo in production; every card has
silently shown its initials-tile fallback since E16-S03 shipped. E22-S02 fixed
only the 6 entries in its own scope. Backfilling the rest needs (a) the same
bucket/alt=media fix, mechanical, and (b) sourcing ~14 more real, correctly-matched
photos — a new backlog story, not done in this session.
```

- [ ] **Step 2: No commit** (this file is outside the repo)

---

### Task 8: Codex review, push, PR

- [ ] **Step 1: Fetch and merge main** (per coordination note — two other sessions are landing PRs from the same main concurrently)

```bash
git fetch origin main
git merge origin/main
```

If this pulls in `admin-web` catalogue API changes, regenerate the OpenAPI client:

```bash
cd admin-web && pnpm run openapi:client
```

- [ ] **Step 2: Run Codex review**

```bash
codex review --base main
```

Fix any findings in Claude, then re-run once per the paired-review policy. Do not iterate past round 2 without checking in.

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/e22-s02-catalogue-categories
gh pr create --title "feat: E22-S02 — Inverter service + real catalogue hero images" --body "$(cat <<'EOF'
## Summary
- Adds the Inverter Install & Service to the Appliance Repair category (the one wave-map E22-S02 item PR #346 didn't cover), inactive pending technician coverage per the existing launch gate.
- Fixes a pre-existing defect: every E22 catalogue hero image pointed at a Firebase Storage bucket (`homeservices-mvp`) that has never existed, and was missing the `?alt=media` suffix needed to serve image bytes instead of JSON metadata. Fixed for the 6 entries in this story's scope; the same bug affects ~14 other pre-existing categories/services, flagged as a separate backlog item (not fixed here — see plan Task 7).
- Replaces PR #346's reused placeholder photos with real, correctly-matched, free-license (Pexels) images for the category and 4 of its services; the 5th (Cooler Service) has no available real match on any free-tier stock source, so it honestly reuses the category's generic photo rather than an unrelated one.
- Hindi parity maintained (`tools/check-hindi-catalogue-parity.mjs` green).

## Test plan
- [ ] `pnpm vitest run` (api) green
- [ ] `node tools/check-hindi-catalogue-parity.mjs` green
- [ ] `bash tools/pre-codex-smoke-api.sh` green
- [ ] All 6 hero image URLs verified `200`/`image/jpeg` via curl against the real bucket
- [ ] Codex review passed

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_014pLCuB1xanXYNX9NnKbPcf
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** wave-map's E22-S02 line item ("Inverter... Fridge, Cooler, Washing Machine, Camera/CCTV... isActive:false... hero images... matching photography style") — Fridge/Cooler/WM/CCTV done in PR #346, Inverter added here (Task 3), hero images sourced and uploaded for all 6 (Tasks 2-3), `catalogue-ids.ts` kept in sync (Task 4), Hindi parity (Task 5). Bucket-URL defect found during brainstorming is fixed for in-scope entries (Task 3) and flagged for the rest (Task 7).
- **Placeholder scan:** no TBD/"add appropriate"/deferred-detail steps — every step has literal code, exact commands, or exact strings to paste.
- **Type consistency:** `appliance-inverter-service` id used identically across Tasks 3, 4, 5, and the PR description.

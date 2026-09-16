# Catalogue Activation (API) Implementation Plan — Story A

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the `appliance-repair` category and all 5 currently-inactive services in prod so the customer app lists them and the technician API accepts them as skills.

**Architecture:** `catalogue.ts` is the seed's source of truth for catalogue content; `mergeSeedDoc` carries `isActive` forward for documents that already exist, so the seed value is only honoured on document creation. All 6 target documents are absent from prod, so flipping their `isActive` to `true` and running `seed:catalogue` creates them active in one step. No API handler changes are needed — `/v1/categories` and the technician skill validator already filter on `isActive`.

**Tech Stack:** TypeScript (Node 22), Azure Cosmos DB serverless, vitest, tsx.

**Spec:** Owner directive, 2026-09-15 — "I want all the services be available to technician and customers both", then "even if they don't have any technician", then "ok then have just 1 technician". Recorded as ADR-0030 in Task 3.

## Global Constraints

- Owner override: the launch gate drops from **≥2** to **≥1** eligible technician per active service/category. Services may ship with single-technician coverage.
- `isActive` for pre-existing prod documents is owner-controlled from the admin dashboard and must never be forced by the seed — do not change `mergeSeedDoc`.
- Prod prices currently match `catalogue.ts` exactly and every prod doc is `updatedBy=seed-script`; the seed run must not alter any price. Verify before and after.
- TypeScript `strict: true`. Tests run with `pnpm --filter api test`.
- Story B (technician-app) must ship to Play **before** Task 5 (the prod seed run). See the gate note on Task 5.

---

### Task 1: Make the launch gate honest and lower it to 1

The existing gate claims to require "KYC-approved + online" technicians but only filters `isOnline`. Fix the claim and lower the threshold in one change, so the assertion means what it says.

**Files:**
- Modify: `api/tests/scripts/seed-technicians.test.ts:44-62`

**Interfaces:**
- Consumes: `TECHNICIANS` from `api/scripts/seed-technicians.ts`; `SERVICES` / `CATEGORIES` from `api/src/cosmos/seeds/catalogue.ts`
- Produces: const `MIN_TECHS_PER_ACTIVE_SERVICE = 1`, used by both gate tests

- [ ] **Step 1: Rewrite both gate tests**

Replace lines 44-62 with:

```ts
// 2026-09-15 (ADR-0030): owner lowered the launch gate from 2 to 1. A service may
// now ship with single-technician coverage; if that technician goes offline the
// service has no coverage and bookings stick silently. Accepted by the owner.
const MIN_TECHS_PER_ACTIVE_SERVICE = 1;

// The filter now checks kycStatus as well as isOnline. The previous version's
// message promised "KYC-approved + online" but only filtered isOnline, so it
// asserted something weaker than it claimed.
const eligibleTechnicians = () =>
  TECHNICIANS.filter(t => t.isOnline && t.kycStatus === 'APPROVED');

it(`every active catalogue serviceId has >=${MIN_TECHS_PER_ACTIVE_SERVICE} online, KYC-approved technician`, () => {
  const eligible = eligibleTechnicians();
  for (const svc of SERVICES.filter(s => s.isActive)) {
    const matchCount = eligible.filter(t => t.skills.includes(svc.id)).length;
    expect(
      matchCount,
      `${svc.id} (${svc.categoryId}) coverage — need >=${MIN_TECHS_PER_ACTIVE_SERVICE} online + KYC-approved tech (ADR-0030)`,
    ).toBeGreaterThanOrEqual(MIN_TECHS_PER_ACTIVE_SERVICE);
  }
});

it(`every active catalogue category has >=${MIN_TECHS_PER_ACTIVE_SERVICE} tech with at least one of its services`, () => {
  const eligible = eligibleTechnicians();
  for (const cat of CATEGORIES.filter(c => c.isActive)) {
    const catServiceIds = new Set(SERVICES.filter(s => s.categoryId === cat.id).map(s => s.id));
    const matchCount = eligible.filter(t => t.skills.some(skill => catServiceIds.has(skill))).length;
    expect(
      matchCount,
      `${cat.id} category coverage — need >=${MIN_TECHS_PER_ACTIVE_SERVICE} eligible tech (ADR-0030)`,
    ).toBeGreaterThanOrEqual(MIN_TECHS_PER_ACTIVE_SERVICE);
  }
});
```

- [ ] **Step 2: Run the tests — they must still PASS**

Run: `cd api && pnpm vitest run tests/scripts/seed-technicians.test.ts`

Expected: PASS. Nothing active yet lacks coverage, and every fixture technician already has `kycStatus: 'APPROVED'`, so tightening the filter changes no outcome. If this FAILS, a fixture technician is missing `kycStatus: 'APPROVED'` — fix the fixture, do not weaken the filter.

- [ ] **Step 3: Commit**

```bash
git add api/tests/scripts/seed-technicians.test.ts
git commit -m "test(api): lower launch gate to 1 tech and make it actually check KYC (ADR-0030)"
```

---

### Task 2: Activate the category and 5 services

**Files:**
- Modify: `api/src/cosmos/seeds/catalogue.ts` — line 26 (category), lines 337, 361, 381, 403, 423 (services)
- Modify: `api/scripts/seed-technicians.ts:52` (fixture coverage for the newly active services)

**Interfaces:**
- Consumes: the gate from Task 1
- Produces: 6 catalogue documents carrying `isActive: true`

- [ ] **Step 1: Flip the category and replace its gating comment**

In `api/src/cosmos/seeds/catalogue.ts`, replace the comment at lines 17-20 with:

```ts
  // 2026-09-15 (ADR-0030): activated by owner directive. The previous
  // isActive:false gate ("no technician can hold an appliance-repair skill until
  // technician-app ships ServiceCatalogue.kt self-select") is discharged by
  // Story B, which replaces the hardcoded picker with a live /v1/categories fetch.
```

Leave the second comment paragraph (the 2026-09-12 heroImageUrl note) untouched. Then on line 26 change `isActive: false` to `isActive: true`.

- [ ] **Step 2: Flip the 5 services**

Change `isActive: false` to `isActive: true` at lines 337, 361, 381, 403, 423 — `appliance-fridge-repair`, `appliance-cooler-service`, `appliance-washing-machine-repair`, `electrical-camera-installation`, `appliance-inverter-service` respectively. Read the enclosing `id:` field to confirm each before editing; do not edit by line number alone.

- [ ] **Step 3: Run the gate — it must now FAIL**

Run: `cd api && pnpm vitest run tests/scripts/seed-technicians.test.ts`

Expected: FAIL, naming all five new services and category `appliance-repair`, each with coverage 0.

This failure is the point — it proves the gate actually exercises the new services rather than passing vacuously. If it passes here, the gate is not reading the flags you just changed; stop and find out why before continuing.

- [ ] **Step 4: Give one fixture technician the new skills**

In `api/scripts/seed-technicians.ts`, replace the `skills` line of `tech-ayd-003` (line 52) with:

```ts
    // ADR-0030: single-technician coverage for the services activated 2026-09-15.
    skills: ['electrical-switchboard-fix', 'electrical-fan-install', 'electrical-wiring', 'ac-deep-clean', 'ac-deep-clean-window', 'appliance-fridge-repair', 'appliance-cooler-service', 'appliance-washing-machine-repair', 'electrical-camera-installation', 'appliance-inverter-service'], // catalogue: electrical + ac-repair + appliance-repair
```

- [ ] **Step 5: Run the gate — it must now PASS**

Run: `cd api && pnpm vitest run tests/scripts/seed-technicians.test.ts`

Expected: PASS.

- [ ] **Step 6: Run the full api suite**

Run: `cd api && pnpm test`

Expected: PASS. If a catalogue test asserts a count of active services, update the expected number — do not revert the activation.

- [ ] **Step 7: Commit**

```bash
git add api/src/cosmos/seeds/catalogue.ts api/scripts/seed-technicians.ts
git commit -m "feat(api): activate appliance-repair category and 5 services (ADR-0030)"
```

---

### Task 3: Record the owner override as an ADR

**Files:**
- Create: `docs/adr/0030-single-technician-launch-gate.md`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR-0030: Lower the launch gate to one technician and activate all catalogue services

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Alok Tiwari (owner)

## Context

The catalogue carried a launch gate asserted in `api/tests/scripts/seed-technicians.test.ts`:
every active category and service needed >=2 online technicians before it could ship. The
`appliance-repair` category and five services (fridge repair, cooler service, washing-machine
repair, CCTV camera installation, inverter install/service) were held at `isActive: false`
behind that gate.

Two facts about the gate as it stood:

1. It asserted over the fixed 10-technician fixture in `api/scripts/seed-technicians.ts`, never
   over production. It could not and did not measure real coverage.
2. Its failure message claimed "KYC-approved + online" but the filter only checked `isOnline`.

Production state when this decision was taken: 17 technicians, 6 dispatchable, **0** with
`kycStatus === 'APPROVED'`, and only 3 physically inside the Ayodhya pilot region.

## Decision

Lower the gate from >=2 to >=1 eligible technician, and activate all six documents.

The owner was shown the coverage numbers above and directed activation regardless — first
"even if they don't have any technician", then settling on a threshold of one.

The gate's filter is also corrected to check `kycStatus === 'APPROVED'` alongside `isOnline`,
so the assertion now means what its message says.

## Consequences

- A service may ship with exactly one technician. If that technician goes offline the service
  has zero coverage, and bookings stick in dispatch silently with no customer-facing error —
  the same failure shape as the documented radius coverage gap. Accepted.
- The gate still catches a service added with no fixture coverage at all, so it retains value
  for future catalogue additions.
- The gate remains fixture-only. It is not evidence of production coverage and must not be
  cited as such. Measure production coverage by querying Cosmos directly, filtering by
  geography as well as `isOnline` / `isAvailable`.
- Dispatch does not filter on `kycStatus` at all, so this change does not affect the separate,
  unresolved fact that unverified technicians receive jobs.

## Alternatives considered

- **Keep the gate at 2 and onboard technicians first.** Rejected by the owner as too slow for
  the pilot.
- **Delete the gate.** Rejected — it still catches a service added with no coverage whatsoever.
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0030-single-technician-launch-gate.md
git commit -m "docs(adr): ADR-0030 single-technician launch gate and catalogue activation"
```

---

### Task 4: Smoke gate and review

- [ ] **Step 1: Run the api smoke gate**

Run: `bash tools/pre-codex-smoke-api.sh`

Expected: exit 0. Run it bare — piping to `tail` reports tail's exit code and masks a gate failure.

- [ ] **Step 2: Codex review**

Run: `codex review --base main`

Fix findings in this session and re-run Codex at most once.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin <branch>
gh pr create --title "feat(api): activate all catalogue services (ADR-0030)" --body "<summary + ADR link>"
```

---

### Task 5: Run the prod seed — GATED ON STORY B

**Do not start this task until Story B has shipped to Play and Story C has merged.** Activating the catalogue while the technician app still uses its hardcoded 13-service list means customers can book services that no technician can select at all, and every such booking sticks permanently.

**Files:** none — this is an operational step.

- [ ] **Step 1: Capture the pre-run price baseline**

Set `CS` first:

```bash
export CS=$(az functionapp config appsettings list --name func-homeservices-prod \
  --resource-group rg-homeservices-prod \
  --query "[?name=='COSMOS_CONNECTION_STRING'].value" -o tsv)
```

Then:

```bash
node -e "const {CosmosClient}=require('./api/node_modules/@azure/cosmos');(async()=>{const db=new CosmosClient(process.env.CS).database('homeservices');const {resources}=await db.container('services').items.query('SELECT c.id,c.basePrice FROM c').fetchAll();console.log(JSON.stringify(resources.sort((a,b)=>a.id.localeCompare(b.id)),null,1));})()" > prices-before.json
```

- [ ] **Step 2: Run the seed**

```bash
cd api && COSMOS_CONNECTION_STRING="$CS" pnpm seed:catalogue
```

Expected: `upserted: appliance-repair (new)` plus 5 service lines ending in `(new)`; every other line upserts without `(new)`.

- [ ] **Step 3: Verify no price moved**

Re-run the Step 1 query into `prices-after.json`, then:

```bash
diff prices-before.json prices-after.json && echo "NO PRICE DRIFT"
```

Expected: the 14 pre-existing services are identical; the only additions are the 5 new ones. If any existing price moved, stop and investigate before doing anything else.

- [ ] **Step 4: Verify activation over the public API**

```bash
curl -s https://func-homeservices-prod.azurewebsites.net/api/v1/categories | jq '.categories[] | {id, services: (.services | length)}'
```

Expected: 6 categories including `appliance-repair` with 4 services.

- [ ] **Step 5: Verify on device**

Customer app: home lists 6 categories; open Appliance Repair and confirm each service renders Hindi copy and a hero image (Story C).

Technician app: service selection lists the new services, and a selection survives a save-and-reload cycle (Story B).

- [ ] **Step 6: Delete the baseline files**

```bash
rm -f prices-before.json prices-after.json
```

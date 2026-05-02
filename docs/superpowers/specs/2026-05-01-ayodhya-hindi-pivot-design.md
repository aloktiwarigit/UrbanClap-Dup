# Ayodhya/UP rural + Hindi-first pilot pivot — Umbrella Spec

**Status:** Brainstorm complete · Codex design-review pass v2 · awaiting owner spec-review · awaits per-story plans
**Date:** 2026-05-01
**Owner:** Alok Tiwari
**Review trail:** Brainstorm with Claude Opus 4.7 (3 Codex consultation rounds: language-toggle, admin-web/catalogue, PR-fate/working-tree) → Codex design-review on v1 surfaced 6 P1 + 4 P2 findings → v2 corrections applied
**Touches:** `customer-app/`, `technician-app/`, `admin-web/` (deferred), `api/`, `docs/`
**Sub-stories spawned:** E12-S01 (Region pivot), E12-S02 (Hindi i18n Android), E12-S03 (Phase 2 stub), E13-S01 (Phase 2 stub)
**Branch:** `feature/E12-pivot` (off `origin/main` @ `e14bb75`)
**Safety branch:** `wip/home-heroo-refinements-2026-05-01` @ `a70dd0d` — preserves prior session's in-flight Home Heroo design refinements; not for merge

---

## 1. Strategic context

The owner confirmed on 2026-05-01 that the **pilot region is Ayodhya, Uttar Pradesh (rural), not Bengaluru/Karnataka**. Hindi must be supported prominently across external mobile surfaces (customer-app + technician-app). The original brainstorm/PRD positioned the pilot as Bengaluru metro with English-first UX and Karnataka-specific compliance framing (`docs/adr/0011-karnataka-decline-history-isolation.md` already merged via PR #54 on 2026-04-29). That positioning is now mis-targeted on **regional scope, language, and audience**, but **not** on the dispatcher's compliance engineering — which remains valuable defensive practice regardless of which state law applies.

The pivot is **strategic, not tactical**: it changes the user audience (rural Hindi-prominent, sub-₹10k smartphones, lower digital literacy), the service catalogue (water-pump/borewell over deep-cleaning), the launch-readiness gate (technician recruitment must match catalogue), and the recruitment-vs-coding sequencing (D22 supersede). It does **not** change the architecture, the ₹0/mo infra constraint, the BMAD ceremony, the Codex-as-authoritative-review-gate policy, or the dispatcher's decline-isolation enforcement.

This umbrella spec ratifies the strategic decisions and crisp-scopes three sub-stories (E12-S01, E12-S02, plus E12-S03 Phase 2 stub and a new E13-S01 Phase 2 stub for technician recruitment). Each sub-story will get its own per-story brainstorm → plan → execute cycle in fresh sessions per project CLAUDE.md cadence; this document is their shared input.

---

## 2. Locked decisions

### 2.1 ADR-0011 — KEEP AS-IS, no supersede

**Decision:** ADR-0011 stays unchanged on `main`. No new ADR is written in this pivot.

**Why this changed from v1:** Codex design-review surfaced that v1's premise — "the 4-layer enforcement is already nationally correct under Central SSC Code 2025, Chapter IX" — is **factually wrong**. The actual statute is the *Code on Social Security, 2020*, and Chapter IX (§109–§114) covers welfare schemes for platform/gig workers, **not** a right-to-refuse obligation. The right-to-refuse provision lives in **Karnataka Act §12** specifically; no equivalent UP state law exists as of 2026-05-01.

**Implication:** The 4-layer dispatcher enforcement (schema + Semgrep + tests + ADR) was originally driven by the Karnataka audit threat. For Ayodhya/UP, it is **defensive engineering** — protection against any future state law that mirrors Karnataka's, plus a footgun-prevention mechanism that costs ~5s of CI time and ~20ms of test-suite time per run. Worth keeping, but the legal-mandate story does not extend.

**Out of pivot scope:** ADR-0011 contains a misattributed Central Code citation that should be corrected. That correction is a separate one-line errata PR, not part of E12. Tracked as a follow-up not blocking the pivot.

### 2.2 Hindi i18n approach (Android — both apps)

**In-app language picker** via `androidx.appcompat.app.AppCompatDelegate.setApplicationLocales()` overrides system locale per-app. **Not** system-locale-only.

**Why:** Codex round 1 cited the rural-UP audience hard:
- Many sub-₹10k Android phones default to English regardless of OEM ROM and user preference
- Asking technicians to change phone-wide language before accepting paid work is a support failure
- PRD `NFR-L` (Localisation, in §"Non-Functional Requirements") already mandates English+Hindi on customer-facing surfaces

**Default-locale-on-first-launch:** **D2 — first-launch language picker**, persisted; subsequent launches honor stored choice; user can switch via Settings → Language. Pattern is industry standard for Hindi-first apps (Khatabook, PhonePe).

**Ordering:** **toggle UI ships BEFORE translation completion.** Without the toggle in place, translating strings into a feature that can't expose locale switching wastes effort and hides Devanagari layout regressions until launch.

**Catalogue Hindi rendering (NEW — per Codex P1.5):** Service and category NAMES are returned by the API and rendered directly in Compose (`CatalogueHomeScreen.kt:134`, `ServiceListScreen.kt:141,148`, `ServiceDetailScreen.kt:212,219`). Android `strings.xml` cannot translate them. Approach: a client-side **`serviceId → Hindi name`** + **`categoryId → Hindi name`** lookup table in `customer-app/.../data/catalogue/HindiLocaleNames.kt` (constant data, no schema/API change). The repo/ViewModel checks current locale; if Hindi, substitutes Hindi name; otherwise renders API-returned name. Services missing from the map fall back gracefully. Same for short descriptions if any are user-visible — to be confirmed during E12-S02 plan-write.

### 2.3 Catalogue rural-suitability + per-serviceId launch gate

**Catalogue change** (E12-S01 scope, no schema change — `api/src/schemas/service.ts` is single-language):
- **Drop:** Pest Control, Deep Cleaning (Bengaluru-metro signal)
- **Add:** Water Pump / Borewell servicing, RO / Water Purifier
- **Keep:** AC Repair, Plumbing, Electrical
- **Net:** 5 active service categories. Each gets a stable serviceId; Hindi names handled per §2.2 in customer-app.

**Launch-gate prerequisite (NEW acceptance criterion on E10-S04 in `docs/stories/README.md:174`):**
> Each active **serviceId** MUST have **≥2 verified technicians** with matching skills inside the Ayodhya service radius (~10km from city centre, lat/lng `[82.20, 26.79]` GeoJSON `[longitude, latitude]` order) before the GrowthBook `marketing.public-launch` flag is allowed to flip to `on`.

**Why per-serviceId, not per-category:** Codex round-3 P1.6 — the dispatcher (`dispatcher.service.ts:43`, `technician-repository.ts:67`) filters exact `booking.serviceId` against `technician.skills`. Gating by category leaves serviceIds with no technicians silently bookable.

**Why ≥2 not ≥1:** Codex P2.3 — single-tech category fails the moment that tech goes offline or declines. ≥2 provides minimum dispatch resilience.

### 2.4 Admin-web i18n — DEFER to Phase 2 (E12-S03 stub only)

Admin-web stays English-only for MVP launch. PRD `NFR-L` requires Hindi only on **external mobile surfaces** (customer-app + technician-app), not internal owner ops. Owner is solo and bilingual; first ops hire is a future hiring/process question, not MVP software scope. Installing `next-intl` now without translations is "false economy" (Codex round 2): adds routing/message/test surface area before any Hindi admin user exists.

**Action:** add a Phase 2 entry to `docs/prd.md` "Project Scoping & Phased Development" section for **E12-S03 — admin-web Hindi i18n** with a "trigger: when first non-bilingual admin user is hired" condition. Scope is intentionally not detailed here.

### 2.5 E13-S01 (Phase 2 stub) — Ayodhya regional technician recruitment

The §2.3 launch gate implies recruitment work that is not in MVP scope today. Add a Phase 2 placeholder to `docs/prd.md` "Project Scoping & Phased Development":
> **E13-S01 — Ayodhya tech recruitment + verification.** Scope: identify ≥2 verified technicians per active serviceId in Ayodhya service radius, complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Trigger: prerequisite to flipping `marketing.public-launch` flag.

This is a recruitment/operations story, not a software story. Tracked here to make the launch-flag prerequisite auditable.

---

## 3. Docs addendum (E12-S01 deliverable)

E12-S01 must edit the following:

| File | Section | Change |
|---|---|---|
| `docs/prd.md` | Executive Summary + §"Project Classification" + §"User Journeys" | Replace "Bengaluru metro" → "Ayodhya, UP rural"; update target audience (Hindi-prominent, rural, sub-₹10k devices) |
| `docs/prd.md` | §"Project Scoping & Phased Development" (line ~662) | Add E12-S03 stub (admin-web Hindi i18n, Phase 2) and E13-S01 stub (Ayodhya tech recruitment, Phase 2) |
| `docs/prd.md` | §"Open Questions" → OQ-3 (catalogue scope, line ~1221+) | Drop Pest Control + Deep Cleaning; add Water Pump/Borewell + RO/Water Purifier |
| `docs/prd.md` | §"Non-Functional Requirements" → NFR-L | Tighten language: Hindi+English MUST be selectable in-app on external mobile surfaces (not system-locale-only) |
| `docs/prd.md` | §"Project Scoping & Phased Development" → D22 (line 771) | **D22 supersede** — see §6.4 below |
| `docs/stories/README.md` | E10-S04 row (line 174) | Add launch-flag AC: ≥2 verified techs per active serviceId in Ayodhya radius before public-launch flag flips |
| `docs/architecture.md` | §1.2 binding constraints | Add: "External mobile surfaces MUST support in-app Hindi/English locale switching." |
| `docs/dispatch-algorithm.md` | (no change) | Karnataka framing remains accurate; no national-mandate claim was ever made in this doc |
| `api/src/cosmos/seeds/catalogue.ts` | (whole file) | Catalogue swap per §2.3; new stable serviceIds for the two added services |
| `api/scripts/seed-technicians.ts` | seed coordinate constants | Replace Bengaluru lat/lng with Ayodhya `[82.20, 26.79]` (GeoJSON order: longitude first) |
| `admin-web/app/login/page.tsx`, `admin-web/app/page.tsx` | mock counters + copy | Replace Bengaluru references with Ayodhya equivalents (still English; admin-web i18n deferred) |
| `admin-web/src/components/dashboard/Topbar.tsx`, `TechMap.tsx` | default map center constant | `[82.20, 26.79]` GeoJSON order |

---

## 4. Sub-story scoping

### 4.1 E12-S01 — Region pivot (Foundation tier, smaller than v1)

**Goal:** Replace Bengaluru/Karnataka positioning with Ayodhya/UP across docs, catalogue seed, admin-web copy, default map center, and analytics defaults. Land D22 supersede explicitly. **No ADR work.**

**Scope (concrete deliverables):** All `docs/`, `api/`, and `admin-web/` edits per §3 above.

**Out of scope (deferred to E12-S02):** Hindi strings; in-app language picker; any Android `values-hi/` work; any Android source-code changes; serviceId→Hindi-name lookup table

**Out of scope (deferred to Phase 2):** admin-web `next-intl` install; Hindi admin translations; tech recruitment; ADR-0011 errata correction

**Story tier:** Foundation. Multi-surface (docs + api + admin-web) but no new modules, no new SDKs, no new architectural patterns, **no new ADR**. Estimated: 1 dev-day (down from v1's 1.5 because ADR work removed).

**Story-size gate prediction:** ≤500 lines of plan; well under Foundation 1500-line cap. Likely Feature-tier on size, but **classified Foundation** because it touches D22 (a locked decision) and PRD scope.

**Pattern library reads required:** none (no Android/Compose work).

### 4.2 E12-S02 — Hindi i18n Android (Foundation tier, expanded from v1)

**Goal:** Both Android apps support in-app Hindi/English switching via `AppCompatDelegate.setApplicationLocales()`, with first-launch picker, complete `strings.xml` translations, AND catalogue serviceId/categoryId → Hindi name lookup.

**Work-stream structure** (per project CLAUDE.md per-story protocol):

- **WS-A:** Domain — `LocaleRepository` interface + AppCompat dependency + first-launch flag in `SessionManager` (both apps share via design-system module)
- **WS-B:** Use cases — `SetAppLocaleUseCase`, `GetAppLocaleUseCase`, `IsFirstLaunchUseCase`. Each TDD'd.
- **WS-C:** Hilt DI — `LocaleModule` in both apps, plus AndroidManifest `application` tag wiring
- **WS-D:** Compose UI — design-system `LanguagePickerDialog` + first-launch screen + Settings → Language entry in both apps; Paparazzi tests with `values-hi/` snapshot variant
- **WS-D2:** Translation completion:
  - `customer-app/app/src/main/res/values-hi/strings.xml`: complete missing **15** strings (current 74 of 89 = 83%); spot-check Aadhaar/background-check badge labels and slot-picker labels (Codex round-1 flagged as trust-flow risks)
  - `technician-app/app/src/main/res/values-hi/strings.xml`: NEW file, full translation of **31** current strings (job-offer Accept/Decline, active-job Start/Complete are launch-critical)
- **WS-D3 (NEW per Codex P1.5):** Catalogue Hindi rendering:
  - `customer-app/.../data/catalogue/HindiLocaleNames.kt`: constant data file with `Map<String, String>` for serviceId→Hindi name AND categoryId→Hindi name
  - Update `CatalogueRepositoryImpl` (or relevant ViewModel boundary) to substitute Hindi names when current locale is `hi`; fallback to API name otherwise
  - Verify which API-returned strings are user-visible during plan-write — at minimum service `name` and `categoryName`; possibly short descriptions
- **WS-E:** Pre-Codex smoke gate (`bash tools/pre-codex-smoke.sh customer-app && bash tools/pre-codex-smoke.sh technician-app`), then Codex review

**Out of scope:** admin-web i18n; Awadhi-dialect strings (Hindi only); RTL layout (Devanagari is LTR); API i18n / bilingual data store

**Story tier:** Foundation. Two apps + new SDK (AppCompat locale APIs) + design-system module changes + 15+31 = 46 string translations + serviceId/categoryId Hindi-name lookup table + Paparazzi Hindi snapshot variants. Estimated: 2.5–3 dev-days.

**Story-size gate prediction:** Likely 1400–1700 lines of plan. **High split risk.** If plan exceeds 1500 lines, split:
- E12-S02a (customer-app: completion of values-hi + serviceId/categoryId Hindi lookup + design-system locale module + first-launch picker on customer-app)
- E12-S02b (technician-app: full values-hi introduction + first-launch picker on technician-app)

Default plan as a single story; split on size gate trigger.

**Pattern library reads required:**
- `docs/patterns/paparazzi-cross-os-goldens.md` (new Hindi screens need CI-recorded goldens)
- `docs/patterns/hilt-module-android-test-scope.md` (new `LocaleModule` injection)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` (new public `LocaleRepository` API)

### 4.3 E12-S03 — Hindi i18n admin-web (Phase 2 stub only — DO NOT IMPLEMENT)

Add a stub to `docs/prd.md` "Project Scoping & Phased Development" Phase 2:
> **E12-S03 — admin-web Hindi i18n.** Trigger: when first non-bilingual admin/ops user is hired. Scope: install `next-intl`; structure `messages/en.json` + `messages/hi.json`; route prefix `/[locale]/...`; translate all admin-web strings. Estimated: 2 dev-days. Tier: Foundation (introduces new library + routing + tests).

No further detail required at this time.

### 4.4 E13-S01 — Ayodhya tech recruitment (Phase 2 stub only — DO NOT IMPLEMENT)

Add a stub to `docs/prd.md` "Project Scoping & Phased Development" Phase 2:
> **E13-S01 — Ayodhya regional tech recruitment + verification.** Trigger: prerequisite to flipping `marketing.public-launch` GrowthBook flag. Scope: identify ≥2 technicians per active serviceId in Ayodhya service radius (~10km from city centre, GeoJSON `[82.20, 26.79]`); complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Operations/recruitment story, not a software story. Tracked here to make the launch-flag prerequisite (E10-S04 acceptance criterion) auditable.

---

## 5. Cross-cutting concerns

### 5.1 Codex review gates

Per owner directive (2026-05-01): Codex CLI is the authoritative adversarial review at **two checkpoints**:

1. **After this umbrella spec is committed** (BEFORE invoking `superpowers:writing-plans` for any sub-story): `codex exec` an adversarial review of this design document. Surface findings as inline edits. Re-run if material changes. **v1 already passed this gate; v2 (this document) corrects 6 P1 + 4 P2 findings from that pass.**
2. **After implementation** (per story, BEFORE merge to main): `codex review --base main` on each E12-S## branch. Standard project policy.

Claude-only review skills (`/code-review`, `/security-review`, `/bmad-code-review`, `/superpowers:requesting-code-review`) are **skipped by default** per `feedback_lean_review_stack.md` memory.

### 5.2 Working-tree state at pivot start

Pivot work begins on `feature/E12-pivot` (commit `d9c9a01` — gitignore housekeeping for Playwright/screenshot scratch + Firebase admin SDK secret protection). Prior session's in-flight Home Heroo design refinements are preserved on `wip/home-heroo-refinements-2026-05-01` (commit `a70dd0d`) — parking-lot branch, not for merge. E11 planning artifacts remain untracked locally; already preserved on `origin/feature/E11-planning-artifacts`.

### 5.3 Sprint state memory refresh

`project_homeservices_sprint_state.md` was 3 days stale at session start (claimed PR #54 OPEN; actually merged 2026-04-29). After this spec is approved, refresh that memory to reflect: (a) PR #54 merged, (b) E10-S99 admin-web hardening shipped, (c) E11 planning artifacts on origin, (d) feature/E12-pivot active.

### 5.4 D22 supersede (NEW per Codex P2.1)

**PRD line 771** currently states: *"Pre-launch vendor recruitment sprint of 2 weeks is mandatory (D22). No coding past Phase 0 until 50 techs onboarded."*

This was Bengaluru-metro context. It has been silently bypassed during 37+ stories of execution. The Ayodhya pivot is the right moment to make the supersede explicit.

**Decision:** D22's "no coding until 50 techs" gate is replaced by the per-serviceId launch-flag prerequisite from §2.3:
> Coding may proceed in parallel with recruitment. **Deployment to production behind `marketing.public-launch` = on** waits for ≥2 verified technicians per active serviceId in the Ayodhya service radius. The soft-launch flag (`marketing.soft-launch`, ≤100 F&F bookings, D23 origin) may flip earlier with ≥1 tech per serviceId.

E12-S01 commits this supersede to `docs/prd.md` line 771 inline (replacing the original text + linking to this spec for the rationale).

### 5.5 Hindi field copy testing (NEW launch-readiness AC per Codex P2.4)

Hindi-only / no-Awadhi is defensible for MVP, but requires field copy testing before public launch. **New acceptance criterion on E10-S04:**
> Hindi `strings.xml` content + serviceId/categoryId Hindi-name lookup table is field-tested with **≥3 Ayodhya technicians and ≥3 Ayodhya customers**; comprehension feedback captured in `docs/launch-readiness/hindi-field-test-2026-XX.md` before `marketing.public-launch` flips on.

---

## 6. Out of scope (explicitly)

- Awadhi or other regional dialects beyond Hindi (post-MVP if field testing surfaces gaps)
- RTL layout support (Devanagari is LTR)
- Server-side i18n or i18n in API responses (catalogue category labels stay English in API; clients localise via `strings.xml` + serviceId/categoryId Hindi-name lookup table)
- iOS app i18n (deferred to Phase 4 per existing PRD)
- next-intl install on admin-web (deferred E12-S03)
- Tech recruitment automation (E13-S01 is operations work, not software)
- ADR-0011 errata correction (separate one-line follow-up PR)
- Migrating existing 37+ stories' Bengaluru-tinged copy beyond the files explicitly listed in §3 — opportunistic cleanup may happen during E12-S01 as it touches files, but is not a deliverable
- Any new ADR

---

## 7. Open questions

None. All Q1–Q4 brainstorm questions resolved during this session. Codex design-review v1→v2 corrections applied.

---

## 8. Appendix — Brainstorm Q&A trail

| Round | Question | Codex recommendation | User decision |
|---|---|---|---|
| 0 (Claude only) | ADR-0011 fate (v1) | n/a | Option A — rename + repoint, supersede with national framing |
| 1 | Language toggle UX (system-locale vs in-app picker) | (b) in-app picker via `AppCompatDelegate.setApplicationLocales()`; toggle UI before translations | Accepted (b); D2 default-locale (first-launch picker) added by Claude synthesis, owner concurred |
| 2 | Admin-web i18n scope | (a) Defer entirely; Phase 2 stub only | Accepted |
| 2 | Catalogue rural-suitability | (b) Partial swap (Pest Control + Deep Cleaning out; Water Pump + RO in) | Accepted, with launch-gate AC modification (technician-prerequisite) |
| 3 | PR #54 fate | (d, refined) — already merged; new follow-up from clean main | Accepted |
| 3 | Working-tree cleanup | (d) inspect-and-split | Accepted; safety branch `wip/home-heroo-refinements-2026-05-01` created |
| Design-review (v1→v2) | Spec correctness | 6 P1 + 4 P2 findings — ADR numbering wrong (must be 0016), national legal framing factually wrong (drop supersede), PRD §14 doesn't exist, string count wrong (89/74/15), catalogue Hindi rendering needs lookup table, launch gate must be per-serviceId ≥2 techs; D22 conflicts; GeoJSON order; Hindi field-test AC needed | All 10 fixes accepted; v2 (this doc) applies them. Net effect: ADR work dropped from pivot, scope-tightened, factual errors corrected |

---

**End of umbrella spec v2.** Awaits owner spec-review. Next step after approval: per-story brainstorm-plan-execute cycles in fresh sessions for E12-S01 (Region pivot, 1 dev-day) and E12-S02 (Hindi i18n Android, 2.5–3 dev-days, possible split).

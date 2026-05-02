# Ayodhya/UP rural + Hindi-first pilot pivot — Umbrella Spec

**Status:** Brainstorm complete · awaiting Codex design-review · awaiting owner spec-review · awaits per-story plans
**Date:** 2026-05-01
**Owner:** Alok Tiwari
**Review trail:** Brainstorm with Claude Opus 4.7 (3 Codex consultation rounds: language-toggle, admin-web/catalogue, PR-fate/working-tree)
**Touches:** `customer-app/`, `technician-app/`, `admin-web/` (deferred), `api/`, `docs/`
**Sub-stories spawned:** E12-S01 (Region pivot), E12-S02 (Hindi i18n Android), E12-S03 (Phase 2 stub), E13-S01 (Phase 2 stub)
**Branch:** `feature/E12-pivot` (off `origin/main` @ `e14bb75`)
**Safety branch:** `wip/home-heroo-refinements-2026-05-01` @ `a70dd0d` — preserves prior session's in-flight Home Heroo design refinements; not for merge

---

## 1. Strategic context

The owner confirmed on 2026-05-01 that the **pilot region is Ayodhya, Uttar Pradesh (rural), not Bengaluru/Karnataka**. Hindi must be supported prominently across customer-facing surfaces. The original brainstorm/PRD positioned the pilot as Bengaluru metro with English-first UX and Karnataka-specific compliance framing (`docs/adr/0011-karnataka-decline-history-isolation.md` already merged via PR #54 on 2026-04-29). That positioning is now mis-targeted.

The pivot is **strategic, not tactical**: it changes the user audience (rural Hindi-prominent, sub-₹10k smartphones, lower digital literacy), the service catalogue (water-pump/borewell over deep-cleaning), the compliance framing (Central SSC Code 2025 nationally, not Karnataka-only), and the launch-readiness gate (technician recruitment must match catalogue). It does **not** change the architecture, the ₹0/mo infra constraint, the BMAD ceremony, or the Codex-as-authoritative-review-gate policy.

This umbrella spec ratifies the strategic decisions and crisp-scopes three sub-stories (E12-S01, E12-S02, plus E12-S03 Phase 2 stub and a new E13-S01 Phase 2 stub for technician recruitment). Each sub-story will get its own per-story brainstorm → plan → execute cycle in fresh sessions per project CLAUDE.md cadence; this document is their shared input.

---

## 2. Locked decisions

### 2.1 ADR-0011 → ADR-0013 supersede (national framing)

`docs/adr/0011-karnataka-decline-history-isolation.md` already shipped via PR #54 (merge `08eb712` on 2026-04-29). The 4-layer enforcement (schema + Semgrep + tests + ADR) is **technically correct nationally** — the Central Social Security Code 2025, Chapter IX (Platform Workers) imposes the same right-to-refuse obligation across India, not only Karnataka. Only the framing is mis-targeted.

**Decision:** ship a new **ADR-0013** within E12-S01 that supersedes ADR-0011's framing, retains all four enforcement layers verbatim, and updates ADR-0011 status to `superseded by 0013`. No code changes to the dispatcher; the Karnataka audit response remains a valid auditable artifact, and UP/national audiences inherit the same protection. Number `0013` chosen because `0012` is already taken by the DPDP audit-log immutability ADR.

### 2.2 Hindi i18n approach (Android both apps)

**In-app language picker** via `androidx.appcompat.app.AppCompatDelegate.setApplicationLocales()` overrides system locale per-app. **Not** system-locale-only.

**Why:** Codex (round 1) cited the rural-UP audience hard:
- Many sub-₹10k Android phones default to English regardless of OEM ROM and user preference
- Asking technicians to change phone-wide language before accepting paid work is a support failure
- PRD `NFR-L:1178` already mandates English+Hindi on customer-facing surfaces

**Default-locale-on-first-launch:** **D2 — first-launch language picker**, persisted; subsequent launches honor stored choice; user can switch via Settings → Language. Pattern is industry standard for Hindi-first apps (Khatabook, PhonePe).

**Ordering:** **toggle UI ships BEFORE translation completion.** Without the toggle in place, translating strings into a feature that can't expose locale switching wastes effort and hides Devanagari layout regressions (PRD `NFR-L-5:1182`) until launch.

### 2.3 Catalogue rural-suitability — partial swap with launch gate

**Catalogue change** (E12-S01 scope, no schema change — `api/src/schemas/service.ts:28` is single-language):
- **Drop:** Pest Control, Deep Cleaning (Bengaluru-metro signal)
- **Add:** Water Pump / Borewell servicing, RO / Water Purifier
- **Keep:** AC Repair, Plumbing, Electrical
- **Net:** still 5 categories; localised category names handled client-side via `strings.xml`-style lookups, not API

**Launch-gate prerequisite (NEW acceptance criterion on E10-S04):**
> Each active service category MUST have ≥1 verified technician with matching skills inside the Ayodhya service radius before the GrowthBook `marketing.public-launch` flag is allowed to flip to `on`.

**Why the gate:** Codex (round 2) flagged that seeding services without technicians breaks dispatch — `api/scripts/seed-technicians.ts:17` uses tech skills as the dispatch matching key. Decoupling code-shipping from recruitment-shipping is achieved by the launch flag: catalogue data lands now; customer-bookable status is feature-flag-gated until at least one matching technician is verified.

### 2.4 Admin-web i18n — DEFER to Phase 2 (E12-S03 stub only)

Admin-web stays English-only for MVP launch. PRD `NFR-L:1178` requires Hindi only on **customer-facing** surfaces, not internal owner ops. Owner is solo and bilingual; first ops hire is a future hiring/process question, not MVP software scope. Installing `next-intl` now without translations is "false economy" (Codex round 2): adds routing/message/test surface area before any Hindi admin user exists.

**Action:** add a Phase 2 entry to `docs/prd.md §14` for **E12-S03 — admin-web Hindi i18n** with a "trigger: when first non-bilingual admin user is hired" condition. Scope is intentionally not detailed here.

### 2.5 E13-S01 (Phase 2 stub) — Ayodhya regional technician recruitment

The Q2 launch gate implies recruitment work that is not in MVP scope today. Add a Phase 2 placeholder to `docs/prd.md §14`:
> **E13-S01 — Ayodhya tech recruitment + verification.** Scope: identify ≥1 verified technician per active service category in Ayodhya service radius, complete DigiLocker KYC + tech-app onboarding for each. Trigger: prerequisite to flipping `marketing.public-launch` flag.

This is a recruitment/operations story, not a software story. Tracked in PRD §14 to make the dependency explicit; no code will be written for it in this pivot.

---

## 3. PRD + docs addendum (E12-S01 deliverable)

E12-S01 must edit the following in `docs/`:

| File | Change |
|---|---|
| `docs/prd.md` §1 (Pilot positioning) | Replace "Bengaluru metro" → "Ayodhya, UP rural"; update target audience description (Hindi-prominent, rural, sub-₹10k devices) |
| `docs/prd.md` §14 (Phases) | Add E12-S03 stub (admin-web Hindi i18n) and E13-S01 stub (Ayodhya tech recruitment) to Phase 2 |
| `docs/prd.md` OQ-3 (catalogue scope) | Drop Pest Control + Deep Cleaning; add Water Pump/Borewell + RO/Water Purifier |
| `docs/prd.md` NFR-L | Tighten language: Hindi+English MUST be selectable in-app (not system-locale-only) |
| `docs/prd.md` E10-S04 acceptance criteria | Add launch-flag prerequisite: ≥1 verified tech per active category in Ayodhya service radius |
| `docs/architecture.md` §1.2 (binding constraints) | Add "Customer surfaces MUST support in-app Hindi/English locale switching" |
| `docs/adr/0011-karnataka-decline-history-isolation.md` | Update Status: `superseded by 0013` |
| `docs/adr/0013-national-decline-isolation-supersede.md` | NEW — see §4 below |
| `docs/dispatch-algorithm.md` | Update framing: "Karnataka right-to-refuse" → "Central SSC Code 2025 right-to-refuse (national)" |

---

## 4. ADR-0013 outline (E12-S01 deliverable)

```markdown
# ADR-0013: National decline-isolation under Central SSC Code 2025

- Status: accepted
- Date: 2026-05-XX (E12-S01 commit date)
- Deciders: Alok Tiwari
- Supersedes: ADR-0011 (Karnataka-specific framing of decline-history isolation)

## Context
The pilot region is Ayodhya, UP rural, not Karnataka. The 4-layer decline-isolation
enforcement landed in PR #54 (commit 08eb712, ADR-0011) is technically correct
nationally — Central Social Security Code 2025, Chapter IX (Platform Workers)
imposes the same right-to-refuse obligation across India. ADR-0011's framing
emphasized the Karnataka Platform Based Gig Workers Act 2025 because that was
the original pilot's compliance audit driver. With the regional pivot, the
framing must generalize.

## Decision
Retain all four enforcement layers from ADR-0011 verbatim:
- Schema layer (api/src/schemas/technician.ts, dispatch-attempt.ts) — no decline-derived fields
- Semgrep layer (api/.semgrep.yml karnataka-no-decline-in-dispatcher rule)
  → renamed to ssc-no-decline-in-dispatcher in this story (rule body unchanged;
  rename keeps Semgrep config aligned with framing)
- Runtime tests (dispatcher-up-ranking.test.ts, dispatcher-data-isolation.test.ts) —
  no test changes; the invariants tested are identical
- Process gate — this ADR + explicit owner approval to relax

## Consequences
Positive: a national framing covers all 28 states + 8 UTs. Karnataka audit
response remains valid (Karnataka Act is a strict subset of the SSC Code 2025
right-to-refuse obligation). UP audit response is now also auditable in source.

Neutral: Semgrep rule rename creates no behavior change.

Negative: One-time documentation refresh effort (this ADR + dispatch-algorithm.md).

## Alternatives considered
- Leaving ADR-0011 as-is and adding a sibling ADR-0013 → rejected as misleading;
  Karnataka framing implied geographic specificity that no longer holds.
- Editing ADR-0011 in place → rejected; ADRs are append-only by convention,
  supersede-and-mark-stale is the right pattern.

## References
- ADR-0011 (superseded — preserved as historical context)
- Central Social Security Code 2025, Chapter IX
- Karnataka Platform Based Gig Workers (Social Security and Welfare) Act 2025
- docs/dispatch-algorithm.md (updated framing)
- api/.semgrep.yml (rule renamed)
```

---

## 5. Sub-story scoping

### 5.1 E12-S01 — Region pivot (Foundation tier)

**Goal:** Replace Bengaluru/Karnataka positioning with Ayodhya/UP across docs, catalogue seed, admin-web copy, default map center, and analytics defaults. Ship ADR-0013 supersede.

**Scope (concrete deliverables):**
- All `docs/` edits per §3 above
- `docs/adr/0013-national-decline-isolation-supersede.md` per §4 outline
- `api/.semgrep.yml`: rename rule `karnataka-no-decline-in-dispatcher` → `ssc-no-decline-in-dispatcher` (rule body identical)
- `api/src/cosmos/seeds/catalogue.ts`: catalogue swap per §2.3 (5 categories, no schema change)
- `api/scripts/seed-technicians.ts`: update seed test data to Ayodhya coordinates (lat/lng around 26.79°N, 82.20°E) instead of Bengaluru
- `admin-web/app/login/page.tsx`, `admin-web/app/page.tsx`: replace Bengaluru mock counters and copy with Ayodhya equivalents (still English; admin-web i18n deferred per §2.4)
- `admin-web/src/components/dashboard/Topbar.tsx`, `TechMap.tsx`: default map center → Ayodhya lat/lng
- Update `docs/stories/README.md` E10-S04 row with the new launch-flag AC

**Out of scope (deferred to E12-S02):** Hindi strings; in-app language picker; any Android `values-hi/` work; any Android source-code changes

**Out of scope (deferred to Phase 2):** admin-web `next-intl` install; Hindi admin translations; tech recruitment

**Story tier:** Foundation. Multi-surface (docs + api + admin-web) but no new modules, no new SDKs, no new architectural patterns. Estimated: 1.5 dev-days.

**Story-size gate prediction:** ≤800 lines of plan; well under Foundation 1500-line cap.

**Pattern library reads required:** none (no Android/Compose work).

### 5.2 E12-S02 — Hindi i18n Android (Foundation tier)

**Goal:** Both Android apps support in-app Hindi/English switching via `AppCompatDelegate.setApplicationLocales()`, with first-launch picker and complete translations.

**Work-stream structure** (per project CLAUDE.md per-story protocol):

- **WS-A:** Domain — `LocaleRepository` interface + AppCompat dependency + first-launch flag in `SessionManager` (both apps share via design-system module)
- **WS-B:** Use cases — `SetAppLocaleUseCase`, `GetAppLocaleUseCase`, `IsFirstLaunchUseCase`. Each TDD'd.
- **WS-C:** Hilt DI — `LocaleModule` in both apps, plus AndroidManifest `application` tag wiring
- **WS-D:** Compose UI — design-system `LanguagePickerDialog` + first-launch screen + Settings → Language entry in both apps; Paparazzi tests with `values-hi/` snapshot variant
- **WS-D2:** Translation completion:
  - `customer-app/app/src/main/res/values-hi/strings.xml`: complete missing 17 strings (current 77/94 = ~82%); spot-check Aadhaar/background-check badge labels and slot-picker labels (Codex flagged these as trust-flow risks)
  - `technician-app/app/src/main/res/values-hi/strings.xml`: NEW file, full translation of ~31 current strings (job-offer Accept/Decline, active-job Start/Complete are launch-critical)
- **WS-E:** Pre-Codex smoke gate (`bash tools/pre-codex-smoke.sh customer-app && bash tools/pre-codex-smoke.sh technician-app`), then Codex review

**Out of scope:** admin-web i18n; Awadhi-dialect strings (Hindi only); RTL layout (Devanagari is LTR)

**Story tier:** Foundation. Two apps + new SDK (AppCompat locale APIs) + design-system module changes + 17+31 = 48 string translations + Paparazzi Hindi snapshot variants. Estimated: 2.5 dev-days.

**Story-size gate prediction:** Likely 1200–1500 lines of plan. Borderline. **If plan exceeds 1500 lines, split** by sub-project: E12-S02a (customer-app completion) → E12-S02b (technician-app introduction). Default plan as a single story; split on size gate trigger.

**Pattern library reads required:**
- `docs/patterns/paparazzi-cross-os-goldens.md` (new Hindi screens need CI-recorded goldens)
- `docs/patterns/hilt-module-android-test-scope.md` (new `LocaleModule` injection)
- `docs/patterns/kotlin-explicit-api-public-modifier.md` (new public `LocaleRepository` API)

### 5.3 E12-S03 — Hindi i18n admin-web (Phase 2 stub only — DO NOT IMPLEMENT)

Add a stub to `docs/prd.md §14` Phase 2:
> **E12-S03 — admin-web Hindi i18n.** Trigger: when first non-bilingual admin/ops user is hired. Scope: install `next-intl`; structure `messages/en.json` + `messages/hi.json`; route prefix `/[locale]/...`; translate all admin-web strings. Estimated: 2 dev-days. Tier: Foundation (introduces new library + routing + tests).

No further detail required at this time.

### 5.4 E13-S01 — Ayodhya tech recruitment (Phase 2 stub only — DO NOT IMPLEMENT)

Add a stub to `docs/prd.md §14` Phase 2:
> **E13-S01 — Ayodhya regional tech recruitment + verification.** Trigger: prerequisite to flipping `marketing.public-launch` GrowthBook flag. Scope: identify ≥1 technician per active service category in Ayodhya service radius (~10km from city centre); complete DigiLocker Aadhaar KYC + PAN OCR + tech-app onboarding for each. Operations/recruitment story, not a software story. Tracked here to make the launch-flag prerequisite (E10-S04 acceptance criterion) auditable.

---

## 6. Cross-cutting concerns

### 6.1 Codex review gates

Per owner directive (2026-05-01): Codex CLI is the authoritative adversarial review at **two checkpoints**:

1. **After this umbrella spec is committed** (BEFORE invoking `superpowers:writing-plans` for any sub-story): `codex exec` an adversarial review of this design document. Surface findings as inline edits. Re-run if material changes.
2. **After implementation** (per story, BEFORE merge to main): `codex review --base main` on each E12-S## branch. Standard project policy.

Claude-only review skills (`/code-review`, `/security-review`, `/bmad-code-review`, `/superpowers:requesting-code-review`) are **skipped by default** per `feedback_lean_review_stack.md` memory.

### 6.2 Working-tree state at pivot start

Pivot work begins on `feature/E12-pivot` (commit `d9c9a01` — gitignore housekeeping for Playwright/screenshot scratch + Firebase admin SDK secret protection). Prior session's in-flight Home Heroo design refinements are preserved on `wip/home-heroo-refinements-2026-05-01` (commit `a70dd0d`) — parking-lot branch, not for merge. E11 planning artifacts remain untracked locally; already preserved on `origin/feature/E11-planning-artifacts`.

### 6.3 Sprint state memory refresh

`project_homeservices_sprint_state.md` was 3 days stale at session start (claimed PR #54 OPEN; actually merged 2026-04-29). After this spec is approved, refresh that memory to reflect: (a) PR #54 merged, (b) E10-S99 admin-web hardening shipped, (c) E11 planning artifacts on origin, (d) feature/E12-pivot active.

---

## 7. Out of scope (explicitly)

- Awadhi or other regional dialects beyond Hindi
- RTL layout support (Devanagari is LTR)
- Server-side i18n or i18n in API responses (catalogue category labels stay English in API; clients localise via `strings.xml`)
- iOS app i18n (deferred to Phase 4 per existing PRD)
- next-intl install on admin-web (deferred E12-S03)
- Tech recruitment automation (E13-S01 is operations work, not software)
- Migrating existing 33+ stories' Bengaluru-tinged copy beyond the files explicitly listed in §3 — opportunistic cleanup may happen during E12-S01 as it touches files, but is not a deliverable

---

## 8. Open questions

None. All Q1–Q4 brainstorm questions resolved during this session.

---

## 9. Appendix — Brainstorm Q&A trail

| Round | Question | Codex recommendation | User decision |
|---|---|---|---|
| 0 (Claude only) | ADR-0011 fate | n/a | Option A — rename + repoint, supersede with national framing (refined to: new ADR-0013 supersedes; ADR-0011 stays historical) |
| 1 | Language toggle UX (system-locale vs in-app picker) | (b) in-app picker via `AppCompatDelegate.setApplicationLocales()`; toggle UI before translations | Accepted (b); D2 default-locale (first-launch picker) added by Claude synthesis, owner concurred |
| 2 | Admin-web i18n scope | (a) Defer entirely; Phase 2 stub only | Accepted |
| 2 | Catalogue rural-suitability | (b) Partial swap (Pest Control + Deep Cleaning out; Water Pump + RO in) | Accepted, with **launch-gate AC modification** added by Claude (technician-prerequisite via E10-S04 flag — adversarial-point rescue from Codex's risk callout) |
| 3 | PR #54 fate | (d, refined) — already merged; new follow-up from clean main | Accepted |
| 3 | Working-tree cleanup | (d) inspect-and-split | Accepted; safety branch `wip/home-heroo-refinements-2026-05-01` created |

---

**End of umbrella spec.** Next step: Codex design-review pass on this document. Then per-story brainstorm-plan-execute cycles begin in fresh sessions for E12-S01 (Region pivot, Foundation tier) and E12-S02 (Hindi i18n Android, Foundation tier).

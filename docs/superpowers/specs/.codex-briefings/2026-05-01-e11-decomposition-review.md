# Codex Adversarial Review — E11 (Durable Screen Hooks) Decomposition

**Reviewer:** OpenAI Codex CLI
**Author:** Claude Opus 4.7 (mid-brainstorm with project owner)
**Date:** 2026-05-01

You are being consulted as an independent senior staff engineer for adversarial review on a story decomposition I (Claude) have proposed to the project owner. The owner has explicitly delegated the open questions to your judgement.

**Don't redesign — attack what's wrong, missing, or under-thought.** Be blunt. Where am I rationalizing? What would a senior staff engineer reading this proposal flag?

You have full repo access — verify any claim against the code (e.g., grep `api/src/functions/` to confirm which endpoints exist).

---

## Project Context

- Monorepo: `customer-app/` (Kotlin + Compose), `technician-app/` (Kotlin + Compose), `api/` (Node 22 + Fastify on Azure Functions + Cosmos DB serverless), `admin-web/` (Next.js).
- **Hard constraint:** ₹0/month operational infra at pilot scale (≤5k bookings/mo). Cosmos serverless cap 1000 RU/s.
- 26/45 stories already shipped across E01–E10. This is proposed **E11 — Durable Screen Hooks**.
- Branch convention: feature branches → Codex review → CI → main.

## Design Goal (owner's framing)

> "Every screen needs durable entry points: workflow path, event/push/deep-link, resume/fallback from normal UI, app-start backend state reconciliation. Events only wake the app — backend state decides reachability."

## Locked Decisions (do not relitigate)

1. **Pending actions are a durable action *index*, not entity source-of-truth.** Persisted Cosmos collection `pending_actions` (partition key `/userId`, deterministic id `<TYPE>:<role>:<userId>:<entityType>:<entityId>`). Source entity always re-fetched on screen entry.
2. **Local store:** Room with `pending_actions` table (per-app). DAO: `upsertAll`, `deleteMissingFromServer`, `observeActive`, `markResolved`, `purgeExpired`.
3. **Routes:** sealed `AppRoute` catalog (per-app) + Compose Nav 2.8 `@Serializable` + `kotlinx-serialization`. New `core-nav` Gradle module holds shared contracts only (`RouteSpec`, `PendingActionType`, `PendingAction`, `NotificationIntent`, URI helpers); Room stays per-app.
4. **Reconciliation triggers:** cold-start-after-auth, home/dashboard `onResume`, FCM receipt, pull-to-refresh.
5. **Deep links:** FCM data-message extras + `homeservices://action/<TYPE>?<args>`. HTTPS App Links deferred (no domain yet).
6. **Initial-route priority ladder (6 tiers):**
   - T0 GATE — unauthenticated → AuthRoute
   - T1 BLOCKING — tech KYC NOT_STARTED/INCOMPLETE → KycRoute
   - T2 LIVE_OPS — tech active job in {ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS}; customer booking AWAITING_PRICE_APPROVAL
   - T3 HIGH_ACTION — JOB_OFFER_ACTIVE (unexpired), SAFETY_SOS_FOLLOWUP
   - T4 NORMAL_ACTION — KYC_RESUME, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP
   - T5 LOW_ACTION — RATING_PROMPT, REVIEW_REVEAL, EARNINGS_UPDATE
   - T6 DEFAULT — role-specific home/dashboard
   - Tie-break within tier: earliest expiresAt → oldest createdAt → lexicographic id.
7. **Foreground FCM never auto-navigates.** If current top route IS the target for the action AND entityId matches → silent `SourceRefreshNeeded`. Else if HIGH priority → persistent banner. Else cards-only update.
8. **Customer ServiceTracking is NOT Tier 2** — surfaces as home card; tap-driven only. (Tech is contractually obligated; customer is not.)
9. **Component split:** `NotificationRouter` parses; `PendingActionStore` persists; `PendingActionIngestor` orchestrates (parse → upsert → emit foreground event / build tray notification).
10. **Strict ordering invariant:** every projector path MUST be `upsert(action) → emit(fcm)`, enforced via Semgrep rule + tests.

## Proposed Story Decomposition

| ID | Title | Tier | Depends on | Plan model |
|---|---|---|---|---|
| **S01** | Android infra: `core-nav` + Room + Router + Ingestor + Coordinator + spike + route migration | Foundation | — | Opus |
| **S02** | Backend: `pending_actions` collection + projector + read API + dashboard endpoints | Feature | — | Sonnet |
| **S03** | Customer home — pending actions + active booking + recent bookings | Feature | S01 + S02 | Sonnet |
| **S04** | Tech dashboard — availability + KYC + assignment + offer + rating + earnings + ratings + support | Feature | S01 + S02 | Sonnet |
| **S05a** | Tech job hooks — add-on request CTA + complaint entry from active/closed job | Feature | S01 + S04 | Sonnet |
| **S05b** | Customer trust truth-up — SOS audio + trust dossier conditional + confidence score conditional | Feature | S01 + S03 | Sonnet |
| **S05c** | Onboarding placement — first-run gate before KYC + persist `onboardingShownAt` | Feature | S01 | Sonnet |
| **S06** | Static reachability CI gate | Foundation (codemod) | S01–S05c | Sonnet |

**Dependency graph:** S01 + S02 (parallel) → S03 + S04 (parallel) → S05a + S05b + S05c (parallel) → S06.

### S01 detail

- Work streams: WS-A core-nav module + tier-ladder pure logic + URI helpers; WS-B per-app Room layer (parallel to WS-A); WS-C per-app NotificationRouter adapter + Ingestor + FCM service wiring; WS-D spike (kotlinx-serialization plugin + 1 simple route + 1 arg route + Paparazzi smoke) + AppRoute catalog seed + **route migration of all existing customer-app + tech-app routes** (Haiku codemod); WS-E cold-start integration (MainActivity → auth → reconcile → tier ladder → coordinator); WS-F smoke + Codex.
- **Risk:** plan length may exceed Foundation 1500-line gate. If so, pre-planned split: **S01a** = core-nav + Room + tier ladder + spike; **S01b** = NotificationRouter + Ingestor + FCM services + cold-start + route migration. Decision deferred to plan-write.

### S02 detail

- Endpoints (some may already exist — first plan task is to grep `api/src/functions/`):
  - `GET /v1/customers/me/pending-actions` (new)
  - `GET /v1/technicians/me/pending-actions` (new)
  - `GET /v1/customers/me/bookings?status=...` (likely partial)
  - `GET /v1/technicians/me/dashboard` (new aggregator)
  - `GET /v1/technicians/me/active-job` (likely exists in `active-job.ts`)
  - `PATCH /v1/technicians/me/availability` (likely missing)
- Cosmos collection + indexes + Zod schema + 5 projector triggers (bookings, ratings, kyc, job_offers, complaints).

### S05a detail

- IN_PROGRESS active-job screen gains "Request add-on" CTA → `POST /v1/bookings/{id}/request-addon` → screen shows "Waiting for customer approval" (new source state `ADDON_PENDING_CUSTOMER_APPROVAL` projected into customer's pending actions).
- Complaint entry from active-job + rating-receive screen → new `ReportIssueRoute`.

### S05b detail

- **SOS audio decision (ADR-required):** A) wire local recording to upload via Firebase Storage (booking-scoped, encrypt-at-rest, 7-day TTL); B) change UI copy to "local recording only — replay on this device." Owner picks.
- Trust dossier conditional render (PlatformTrustCard before assignment).
- Confidence score conditional load (only after technicianId assigned).

### S06 detail

- Gradle task `:reachabilityCheck` reflects on `AppRoute` sealed hierarchy + manifest deep-links + `PendingActionType` enum + NavGraph composable bindings + per-app `WorkflowEntries.kt`.
- **Asserts:** every AppRoute leaf has ≥1 of {workflow entry, FCM type → routeFor, deep-link filter, dashboard pending-action mapping}. CI gate.
- **Out of scope:** runtime "fetch backend state before sensitive action" — code-review checklist only.

---

## Open Questions for You to Answer Authoritatively

**Q-A. S01 split contingency.** Defer split decision to plan-write time, or pre-commit to splitting into S01a (infra + spike) + S01b (FCM services + cold-start + route migration) regardless of size?

**Q-B. S02 endpoint confirmation.** Defer endpoint-existence verification to plan-write, or grep `api/src/functions/` now and amend S02's scope before writing the spec?

**Q-C. S05b SOS audio decision.** Block S05b execution until owner picks A vs B, or carve out the SOS sub-task into its own micro-story (S05b-1 SOS, S05b-2 trust dossier + confidence) so the trust/confidence work is unblocked?

---

## Adversarial Challenges (be blunt)

**C-1. Decomposition completeness.** Is any story missing? Specifically:
- Do we need a separate observability/instrumentation story (e.g., metric: "% of FCM deliveries that result in a `pending_actions` row write within N seconds")? Or is that a per-story acceptance criterion?
- Do we need a dedicated "logout / cross-user residue cleanup" story (Room.clearAll on logout, FCM token rotation, projector idempotency on user-id reuse)? Or does that fold into S01?
- Should there be an explicit "kill the in-memory event bus" cleanup story for the existing fragile paths in E04-S03 / E06-S03 / E07-S01 / E08-S03? Or does that fold into S03 / S04 amendment scope?

**C-2. S01 spike + route migration in one story.** Is bundling the right call, or should the spike be its own micro-story (S00) ahead of S01? My instinct: bundle to avoid coordinating two ceremony tiers, but if the spike fails I'd be mid-story with no fallback path. Codex: spike-as-its-own-story Y/N?

**C-3. S06 placement at the end.** Should the static reachability gate be S01-adjacent (warn-only mode early; fail mode after S05c) so it grows with the codebase, or is end-of-epic placement correct? My fear of placing it earlier: noise from legitimately-unreachable-yet routes during S03/S04/S05* development. But maybe warn-only + fail-late is better than no gate during development?

**C-4. S05a depending on S04 (not S01 directly).** S05a's add-on CTA lives on the active-job screen, which exists today (E06-S01). The pending-action wire-up that S05a creates lands a new `PendingActionType.ADDON_PENDING_CUSTOMER_APPROVAL`. Does S05a need S04's dashboard scaffolding, or only S01's infra? If only S01: S05a can ship in parallel with S03/S04, shortening the critical path by ~2 days.

**C-5. S02 projector source coverage.** The 5 projectors are bookings, ratings, kyc, job_offers, complaints. The `complaints` collection assumes E07-S03 has shipped — has it? If not, that projector is no-op until E07-S03 lands. Verify by reading repo state. Same for `job_offers` (E05-S03/S04).

**C-6. Bundling all 5 projectors into S02.** Right call, or should I split per-source? My case for one story: shared upsert-before-FCM invariant, shared Semgrep rule, shared idempotency tests, shared Cosmos schema. Splitting = 5 stories with mostly-duplicated test scaffolding. Codex: 1 story or 5?

**C-7. The cross-app RouteSpec enum drift risk.** core-nav holds the canonical `RouteSpec` enum; both apps consume it. Customer-app and tech-app have largely disjoint route inventories — only PRICE_APPROVAL_REQUIRED + ADDON_PENDING_CUSTOMER_APPROVAL are cross-cutting. Does shoving ALL route specs into one shared enum create unnecessary coupling? Or is one-enum-per-namespace (customer routes / tech routes / shared) cleaner? Trade-off: shared enum simplifies S06's reachability gate; namespaced enums prevent accidental cross-app references.

**C-8. The `PATCH /v1/technicians/me/availability` claim.** I've assumed it doesn't exist and is a net-new endpoint. The owner's design called it "real backend toggle, not local-only state." Verify by reading `api/src/functions/technicians.ts` and tell me if I'm wrong.

**C-9. Foreground FCM banner suppression.** "If current top route IS the target → silent SourceRefreshNeeded" — what if the screen has unsaved user input (e.g., customer is mid-rating draft when ADDON_PENDING_CUSTOMER_APPROVAL fires for the same booking)? The silent refresh might wipe state. Is there a missing "preserve dirty state" rule, or is this a non-issue because the rating screen and price-approval screen are different routes for different `entityId`s?

**C-10. Tier-ladder live-ops asymmetry.** Tier 2 force-routes tech to active job but NOT customer to tracking. Defensible UX, but it creates an asymmetry that future contributors will be tempted to "fix." Should the spec explicitly document the asymmetry as a deliberate UX rule with the rationale, or just leave it as the tier-ladder definition?

---

## What I Need From You

For each Q-A / Q-B / Q-C — **a one-paragraph answer with your recommendation**.

For each C-1 through C-10 — **flag if I'm wrong, dismiss if I'm right, suggest a concrete fix if there's a better answer**.

Then a final paragraph: **"What would a senior staff engineer reading this proposal flag that I haven't asked about?"**

Be terse. No essays. No diplomatic hedging. If I'm rationalizing, say so.

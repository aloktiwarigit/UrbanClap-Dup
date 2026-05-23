# Customer-app Gap Closure — Enterprise-grade Solution Plan

**Status:** Approved 2026-05-12 (owner sign-off via plan-mode; sub-decisions defaulted per "Open decisions" section)
**Author:** Claude (Opus 4.7), as principal solution architect
**Date:** 2026-05-11 (drafted) / 2026-05-12 (approved + persisted)
**Source plan-mode artifact:** `~/.claude/plans/warm-brewing-haven.md`
**Scope:** Close 22 P0 + 41 P1 gaps from `docs/audit/customer-app-gap-audit-2026-05-11.md`
**Sub-projects touched:** `customer-app/`, `api/`, `technician-app/`, `design-system/`, `docs/`
**Target wall-clock:** 6 sprint-weeks (≈30 dev-days). 4-week aggressive variant outlined at end.

---

## Context

The 6-slice parallel audit found that customer-app's data + use-case layers are largely correct but the **customer-visible surface is thin**: Hindi pivot ~70% English literals on high-stakes screens; `TrustDossierCard` and `BiometricGateUseCase` fully built with **zero production callers**; FCM has no `NotificationChannel` registration so backgrounded users miss everything; `NO_SHOW_CREDIT_ISSUED` silently dropped; no wallet UI to surface the ₹500 guarantee; map sits frozen between stage transitions; no in-app PDF viewer; no DPDP delete-account flow (Google Play policy risk).

The audit identified **five cross-cutting themes** that explain why so many gaps cluster: (A) half-done i18n, (B) dead components, (C) broken FCM background story, (D) invisible platform artifacts, (E) missing entry points. This plan attacks each theme as a workstream rather than story-by-story so we don't paper over the underlying architectural drift.

**Critical alignment finding (from Phase 1 exploration):**
- `docs/superpowers/specs/2026-05-01-e11-durable-screen-hooks-design.md` already designs ~40% of the cross-cutting infrastructure we need (FCM tray notifications, `homeservices://action/*` deep-link URIs, Room `pending_actions` table, NotificationRouter, cold-start tier-ladder, SOS device-token routing). 12 E11 stories are scoped but not yet executed.
- `docs/adr/0012-dpdp-rights-endpoints.md` API endpoints exist server-side. Only the customer-app UI is missing.
- API endpoints for confidence-score-with-GPS, rating reveal, and no-show FCM are complete — gaps are purely customer-app rendering.

**Implication:** This plan **executes and extends E11** rather than competing with it, plus adds new epics for the remaining gaps that E11 doesn't cover. We do not redesign FCM/offline; we ship the existing design and bolt on missing pieces.

---

## Architectural alignment

| Concern | Already designed | Plan stance |
|---|---|---|
| FCM tray notifications + channels | E11 spec §2.7, §4.2-4.5 | Execute via E11-S01b-1 |
| Deep-link URI `homeservices://action/*` | E11 spec §2.5, §3.1 | Execute via E11-S01a + S01b-1 |
| Room `pending_actions` offline queue | E11 spec §3.4 | Execute via E11-S01a |
| NotificationRouter + Ingestor | E11 spec §3.5 | Execute via E11-S01b-1 |
| SOS off-topic device-token routing | Threat-model S-A1/I-A2, E11-S05b-2 | Execute via E11-S05b-2 |
| DPDP rights API endpoints | ADR-0012 (shipped) | Only customer-app UI net-new (E15) |
| Confidence Score API with GPS | `technicians.ts:301-371` (shipped) | Only customer-app GPS wiring net-new (E14) |
| Rating reveal state machine | `ratings.ts:101-143` (shipped) | Already correct customer-app side |
| Hindi locale switching infrastructure | `LocaleRepositoryImpl`, `AppCompatDelegate.setApplicationLocales()` | Execute via E12-S02a string sweep |
| Design-system tokens + Geist Sans Variable | `design-system/theme/` (shipped) | Reuse; no new design system |
| Karnataka dispatch isolation (ADR-0006/0011) | Immutable | Never touch dispatcher ranking |

**Net-new architectural decisions requiring ADRs:**
- ADR-0017 — Customer wallet ledger projection + credit application (new)
- ADR-0018 — Customer-app Hindi-default pivot supersedes English-default in `LocaleRepositoryImpl` (extends ADR-0016)
- ADR-0019 — Periodic technician location push (foreground service + 30 s cadence + battery posture)
- ADR-0020 — Service-area polygon gating in `POST /v1/bookings` (Ayodhya pilot polygon, Phase-2 expansion playbook)

**Threat-model updates required:**
- Mitigate S-A1 / I-A2 via E11-S05b-2 (SOS off-topic)
- Add row for wallet-credit fraud (replay, negative balances, double-application)
- Add row for periodic-location push DoS (rate-limit, abuse)
- Verify DPDP §11/§12 customer-side completeness post-E15

---

## Epic decomposition

Eight epics, 28 stories total. Existing E11 + E12 are executed/extended; six new epics (E13-E18) close the rest.

```
E11 — Durable Screen Hooks               [already designed; 12 stories]
  ├── E11-S01a   Core-nav + Room infra
  ├── E11-S01b-1 Router + Ingestor + FCM service refactor + cold-start
  ├── E11-S01b-2 Route migration + event-bus removal
  ├── E11-S02    Backend pending_actions + projectors
  ├── E11-S03    Customer home durable hooks
  ├── E11-S04    Technician dashboard hooks
  ├── E11-S05a   Tech job-execution hooks
  ├── E11-S05b-1 Customer trust-dossier + confidence wiring
  ├── E11-S05b-2 Customer SOS audio truth-up (encrypted Firebase upload)
  ├── E11-S05c   Onboarding placement
  ├── E11-S06-warn  Static reachability gate (warn-only)
  └── E11-S06-fail  Static reachability gate (promote to fail)

E12 — Bilingual Pivot                    [E12-S01 docs only shipped; extends here]
  ├── E12-S02a   Customer-app Hindi sweep (THIS IS THE BIG ONE)  [Foundation]
  └── E12-S02b   Tech-app Hindi sweep (out of scope; called out for sequencing)

E13 — Customer Wallet + No-Show Closure  [NEW: 4 stories]
  ├── E13-S01   API: wallet endpoints (balance / ledger / apply-credit) [Foundation]
  ├── E13-S02   Customer-app: WalletScreen + balance chip on home  [Feature]
  ├── E13-S03   Customer-app: no-show banner + credit-apply on next booking [Feature]
  └── E13-S04   Razorpay route refund cascade for credit application [Feature, API]

E14 — Customer Trust & Identity Hardening [NEW: 4 stories]
  ├── E14-S01   Wire Trust Dossier into LiveTracking + ServiceDetail [Feature]
  ├── E14-S02   Confidence Score real-GPS wiring + methodology i18n [Feature]
  ├── E14-S03   Biometric gate injected at price-approval + payment + profile-delete [Feature]
  └── E14-S04   Sign-out hardening (FirebaseAuth.signOut + unsubscribeFromTopic + IdTokenCache cancel) [Feature]

E15 — DPDP Self-Service                  [NEW: 2 stories]
  ├── E15-S01   Settings → Data Export UI + download flow  [Feature]
  └── E15-S02   Settings → Delete Account UI + 7-day cool-off countdown + revoke [Feature]

E16 — Catalogue v2 + Booking Hardening   [NEW: 5 stories]
  ├── E16-S01   API: service-area polygon gating in POST /v1/bookings  [Foundation, security]
  ├── E16-S02   API: GET /v1/services/{id}/availability + slot-conflict locking  [Feature]
  ├── E16-S03   Customer-app: photo-first catalogue (category + service cards from Firebase CDN)  [Feature]
  ├── E16-S04   Customer-app: address picker — Places autocomplete + draggable pin + service-area UX  [Foundation]
  └── E16-S05   Customer-app: slot picker — API-driven + past-time filter  [Feature]

E17 — Active-Job Closeout                [NEW: 5 stories]
  ├── E17-S01   API: photos projection in GET /v1/bookings/{id} + signed URLs  [Feature]
  ├── E17-S02   API + tech-app: periodic location push (30 s cadence, foreground service)  [Foundation, cross-app]
  ├── E17-S03   Customer-app: stale-data heartbeat + tech-identity card on LiveTracking  [Feature]
  ├── E17-S04   Customer-app: photo carousel + before/during/after lightbox on LiveTracking  [Feature]
  └── E17-S05   Customer-app: service-report PDF viewer + Booking-confirmed live progress  [Feature]

E18 — Post-Service Polish + Security     [NEW: 6 stories]
  ├── E18-S01   Customer-app: rating + complaint entry points from bookings list  [Feature]
  ├── E18-S02   Customer-app: complaint SLA countdown + history list + reopen flow  [Feature]
  ├── E18-S03   Customer-app: rating shield Hindi copy + ≤2★ vs <3★ ADR decision + tip-chip marker  [Feature]
  ├── E18-S04   Customer-app: payment-failed retry path + Razorpay key release-time guard  [Feature]
  ├── E18-S05   Customer-app: profile editable fields (saved addresses + notification toggles)  [Feature]
  └── E18-S06   Customer-app: Sentry user-context + breadcrumbs on nav + PostHog events (or ADR to defer)  [Feature]
```

**Total:** 12 (E11) + 1 (E12) + 4+4+2+5+5+6 = **39 stories** across 6 weeks. About 6-7 in flight per week, average 0.7-0.8 dev-days each (Foundation stories 1.5-3 dev-days, Feature 0.5-1).

---

## Dependency graph

```
E11-S01a (core-nav + Room)
  ├──> E11-S01b-1 (router + ingestor)
  │      └──> E11-S01b-2 (route migration)
  │             └──> E11-S03..S05c (per-screen hooks)
  └──> E11-S02 (backend pending_actions, parallel)

E12-S01 (docs, shipped) ──> E12-S02a (Hindi sweep) ──> Paparazzi Hindi goldens

E13-S01 (wallet API) ──> E13-S02 (WalletScreen) ──> E13-S03 (no-show banner)
                          └──> E13-S04 (credit-apply on booking)

E11-S01b-1 ──> E13-S03 (banner needs durable-hook FCM landing)
E11-S05b-1 ──> E14-S01 (Trust Dossier wiring) ──> E14-S02 (confidence GPS)
                                           └──> E17-S03 (tracking-screen dossier)

E14-S03 (biometric) depends on session-fresh-N-min decision in ADR-0017
E14-S04 (sign-out) is independent

E15-S01 + S02 are independent of E11 (settings-screen routes)

E16-S01 (service-area gating) blocks E16-S04 (address UX)
E16-S02 (availability API) blocks E16-S05 (slot UX)
E16-S03 (photo-first catalogue) is independent

E17-S01 (photos API) blocks E17-S04 (photo carousel)
E17-S02 (periodic location, cross-app) blocks E17-S03 (heartbeat + stale)

E18-S01 (entry points) depends on E13-S02 (wallet route exists) for credit-applied state on rebook
E18-S02 (complaint SLA + history) depends on E11-S01b-2 (route migration) for reopen deep-link
E18-S03 (shield Hindi) depends on E12-S02a (Hindi sweep)
E18-S04 (Razorpay guard) is independent
E18-S05 (profile fields) is independent
E18-S06 (Sentry user-context) is independent

Karnataka invariant (ADR-0006/0011): NO story below touches dispatcher ranking. Verified.
```

**Critical path:** E11-S01a → S01b-1 → S01b-2 → S05b-2 (SOS) [~7 dev-days] is the longest chain.

---

## Sequencing (6-week sprint plan)

Designed for parallel execution where dependencies allow. Subagent fan-out keyed to Sonnet for implementation, Opus for plan-write on Foundation tier, Haiku for codemods (Hindi sweep, sign-out hardening).

### Week 1 — Foundation: durable hooks + Hindi sweep + service-area + wallet API

Parallel streams. All Foundation tier or codemod tier.

| Stream | Story | Tier | Owner | Output |
|---|---|---|---|---|
| 1.1 | E11-S01a (core-nav + Room) | Foundation | Opus plan, Sonnet exec | New `core-nav` module + Room `pending_actions` table |
| 1.2 | E11-S02 (backend pending_actions) | Foundation | Opus plan, Sonnet exec | Cosmos container + 5 projectors + Semgrep ordering rule |
| 1.3 | E12-S02a (customer-app Hindi sweep) | Foundation (large codemod) | Haiku exec under Sonnet supervision | ~120 missing string keys, all UI converted to `stringResource`, `formatRupees` → `NumberFormat`, Noto Sans Devanagari bundled |
| 1.4 | E16-S01 (service-area gating API) | Foundation, security | Sonnet | Ayodhya polygon + `POST /v1/bookings` validation + `SERVICE_NOT_AVAILABLE_AT_LOCATION` error |
| 1.5 | E13-S01 (wallet API) | Foundation | Sonnet | `GET /v1/wallet/balance`, `GET /v1/wallet/ledger`, `applyCredit` on `POST /v1/bookings` |

**Week-1 exit criteria:**
- `pre-codex-smoke-{api,customer-app}.sh` green on all
- Codex review passed on each
- Hindi-sweep Paparazzi goldens recorded on CI Linux
- ADR-0017 (wallet), ADR-0018 (Hindi default), ADR-0020 (service-area) committed
- Threat-model rows added for wallet fraud + location DoS + service-area-bypass

### Week 2 — Connect the wires: FCM tray + DPDP UI + trust wiring

| Stream | Story | Tier |
|---|---|---|
| 2.1 | E11-S01b-1 (router + ingestor + FCM service refactor) | Foundation |
| 2.2 | E14-S04 (sign-out hardening) | Feature |
| 2.3 | E15-S01 (data-export UI) | Feature |
| 2.4 | E15-S02 (delete-account UI + cool-off + revoke) | Feature (needs biometric — depends on E14-S03 but only for confirmation gate; default to PIN until S03 ships) |
| 2.5 | E18-S04 (Razorpay key guard + payment-failed retry) | Feature |
| 2.6 | E18-S06 (Sentry user-context + breadcrumbs) | Feature |

**Week-2 exit criteria:** Notification channels created; tray notifications fire for all 5 FCM types; deep-links route correctly into screens; data-export downloads JSON; delete-account submits with 7-day countdown; payment retry works.

### Week 3 — Trust + confidence + biometric + wallet UI

| Stream | Story | Tier |
|---|---|---|
| 3.1 | E11-S01b-2 (route migration + event-bus removal) | Foundation |
| 3.2 | E11-S05b-1 (trust dossier + confidence wiring per durable-hooks) | Feature |
| 3.3 | E14-S01 (wire dossier into LiveTracking + ServiceDetail) | Feature |
| 3.4 | E14-S02 (confidence GPS + methodology i18n) | Feature |
| 3.5 | E14-S03 (biometric gate injection — price approval, payment, profile delete) | Feature |
| 3.6 | E13-S02 (WalletScreen) | Feature |

**Week-3 exit criteria:** Trust Dossier visible on tracking + service-detail; ETA pill renders with real GPS; biometric prompt fires before Razorpay; wallet balance visible in app.

### Week 4 — No-show closure + post-service polish + catalogue v2

| Stream | Story | Tier |
|---|---|---|
| 4.1 | E11-S03 (customer home durable hooks) | Feature |
| 4.2 | E13-S03 (no-show banner + FCM branch handler) | Feature |
| 4.3 | E13-S04 (credit-apply on next booking + Razorpay route adjustments) | Feature |
| 4.4 | E18-S01 (rating + complaint entry points on bookings list) | Feature |
| 4.5 | E18-S02 (complaint SLA countdown + history list + reopen) | Feature |
| 4.6 | E18-S03 (shield Hindi + tip-chip marker + ≤2★ vs <3★ ADR) | Feature |
| 4.7 | E16-S03 (photo-first catalogue UI) | Feature (parallel with photo asset commissioning) |

**Week-4 exit criteria:** No-show flow visible end-to-end (FCM → banner → wallet → credit-apply); rating + complaint reachable from bookings list; complaint countdown rendered.

### Week 5 — Active-job closeout + address UX

| Stream | Story | Tier |
|---|---|---|
| 5.1 | E11-S05b-2 (SOS audio truth-up — encrypted Firebase upload, 7-day TTL) | Feature, security |
| 5.2 | E11-S04 + S05a + S05c (tech dashboard, job execution, onboarding hooks) | Feature |
| 5.3 | E17-S01 (photos projection API) | Feature |
| 5.4 | E17-S02 (periodic location push — API + tech-app foreground service) | Foundation, cross-app |
| 5.5 | E16-S02 (availability API) | Feature |
| 5.6 | E16-S04 (address picker — Places + draggable pin + service-area UX) | Foundation |
| 5.7 | E16-S05 (slot picker API-driven) | Feature |

**Week-5 exit criteria:** Tech location updates every 30 s on customer map; SOS audio uploads encrypted; address-picker autocomplete + service-area refusal works; slots reflect real availability.

### Week 6 — Customer artifacts + profile + reachability gate

| Stream | Story | Tier |
|---|---|---|
| 6.1 | E17-S03 (stale-data heartbeat + tech-identity card) | Feature |
| 6.2 | E17-S04 (photo carousel + lightbox) | Feature |
| 6.3 | E17-S05 (PDF viewer + booking-confirmed live progress) | Feature |
| 6.4 | E18-S05 (profile editable fields + saved addresses + notification toggles) | Feature |
| 6.5 | E11-S06-warn (reachability gate — warn) | Foundation |
| 6.6 | E11-S06-fail (reachability gate — fail) | Foundation (after warn stable) |
| 6.7 | Soft-launch readiness sweep | — |

**Week-6 exit criteria:** All P0+P1 stories merged; CI reachability gate enforced; launch checklist in `docs/launch-checklist.md` updated and green; soft-launch flag flippable.

---

## Cross-cutting infrastructure (delivered alongside the stories)

### New ADRs (Week 1 commits)

| ADR | Title | Owner | Story link |
|---|---|---|---|
| 0017 | Customer wallet ledger projection + credit application | API | E13-S01 |
| 0018 | Customer-app Hindi-default pivot (supersedes en-default in LocaleRepositoryImpl) | Mobile | E12-S02a |
| 0019 | Periodic technician location push — foreground service, 30 s cadence, battery posture | Cross-app | E17-S02 |
| 0020 | Service-area polygon gating in POST /v1/bookings — Ayodhya pilot + Phase-2 expansion playbook | API | E16-S01 |
| 0021 (optional) | Rating shield threshold: 3★ vs ≤2★ — narrow vs broad shield rationale | Product+Eng | E18-S03 |
| 0022 (optional) | PostHog + OpenTelemetry deferral if not adopted | Eng | E18-S06 |

### Threat-model rows (Week 1 commits)

- **S-W1** Wallet credit fraud — replay of `applyCredit`, negative balances, race on concurrent bookings. Mitigation: Cosmos `_etag` optimistic concurrency on `customer_credits` doc; server-side balance recompute on every read; idempotency-key on credit-apply request.
- **D-L1** Periodic location push DoS — rogue tech-app or replay-attack flooding `POST /v1/technicians/active-job/{id}/location`. Mitigation: per-tech rate limit (1 req/15 s — slightly slower than 30 s push to allow retry), Cosmos write throttle, fail-open on exceeded quota.
- **T-B1** Service-area bypass — client-spoofed lat/lng in `POST /v1/bookings`. Mitigation: server-side Turf.js polygon check; reject `400 SERVICE_NOT_AVAILABLE_AT_LOCATION`; log + alert on >5 rejections/min/customer (possible reconnaissance).
- **S-A1 / I-A2** (existing, mitigated) — SOS topic PII leak. E11-S05b-2 moves to device-token send.

### Feature flags (GrowthBook)

All new customer-app surfaces ship behind kill-switches so we can roll back instantly during soft-launch:

| Flag | Default | Scope | Owner |
|---|---|---|---|
| `customer.wallet.visible` | `off` (turn on Week 4 exit) | E13 | Product |
| `customer.tray-notifications.enabled` | `off` (turn on Week 2 exit) | E11-S01b-1 | Eng |
| `customer.places-autocomplete.enabled` | `off` (turn on Week 5 exit, geo-gate to Ayodhya) | E16-S04 | Eng |
| `customer.dpdp-self-service.enabled` | `off` (turn on Week 2 exit, required for Play Store) | E15 | Legal+Product |
| `customer.biometric-gate.required` | `off` initially, `on` Week 3 exit, with PIN fallback | E14-S03 | Eng |
| `customer.periodic-location.enabled` | `off` (turn on Week 5 exit) | E17-S02 | Eng |
| `customer.photo-first-catalogue.enabled` | `off` (toggle after asset commissioning) | E16-S03 | Product |
| `customer.service-area-gating.enabled` | `off` initially (warn-only), `on` Week 1 exit | E16-S01 | Eng |
| `customer.rating-shield.threshold` | `2` (paise of overall ★ that triggers shield); flip to `3` after ADR-0024 | E18-S03 | Product |

### Observability (Sentry + PostHog)

- **Sentry user binding** (E18-S06): `Sentry.setUser(User(id = sha256(uid).take(16)))` on `AuthState.Authenticated`; `setUser(null)` on Unauthenticated. Add `NavController.OnDestinationChangedListener` → `Sentry.addBreadcrumb` on every route change.
- **PostHog event taxonomy** (E18-S06): minimal soft-launch set — `auth.{started,truecaller_success,otp_verified,signout}`, `catalogue.{viewed,category_tapped,service_tapped}`, `booking.{address_entered,slot_picked,summary_viewed,payment_initiated,payment_succeeded,payment_failed}`, `tracking.{opened,eta_shown,location_stale_warning_shown}`, `rating.{prompt_received,opened,submitted,shield_shown,shield_escalated}`, `complaint.{created,viewed,reopened}`, `sos.{consent_shown,countdown_started,sent,cancelled}`, `wallet.{opened,credit_visible,credit_applied}`. Alternative: ADR-0022 defers PostHog to Phase 2 if budget tight.

### Design system (no new module; reuse existing)

All new screens (`WalletScreen`, photo-first `CategoryCard`/`ServiceCard`, address-picker UI, complaint-history list, photo-carousel, PDF viewer host, profile editable fields) use:
- `design-system/components/HsComponents.kt` for buttons
- `design-system/theme/Typography.kt` (Geist Sans Variable) — bundle Noto Sans Devanagari fallback for Hindi
- `design-system/theme/Color.kt`, `Spacing.kt`, `Radius.kt`, `Elevation.kt` tokens
- `frontend-design` skill invoked at plan-write time for visual direction on E13-S02 (WalletScreen), E16-S03 (catalogue v2), E17-S04 (photo carousel) — per memory `feedback_frontend_design_skill.md`.

---

## Per-epic acceptance criteria (terse — full ACs in story files)

### E12-S02a — Customer-app Hindi sweep [Foundation, large codemod]
- **AC-1** Every Compose `Text("...")` / `OutlinedTextField label=...` literal in the listed files moved to `R.string.*` with EN + HI translations. Files: `AuthScreen.kt`, `LiveTrackingScreen.kt`, `SosBottomSheet.kt`, `SosConsentDialog.kt`, `ComplaintScreen.kt`, `RatingScreen.kt`, `CustomerBookingsScreen.kt`, `AddressScreen.kt`, `PriceApprovalScreen.kt`, `ConfidenceScoreRow.kt`, `BookingViewModel.kt`/`ComplaintViewModel.kt` (errors), `CatalogueHomeScreen.kt`.
- **AC-2** `formatRupees` / `"Rs ..."` literals replaced with shared `formatInr(paise, locale)` using `NumberFormat.getCurrencyInstance(Locale("en","IN"))`. Used everywhere a price appears.
- **AC-3** `LocaleRepositoryImpl.DEFAULT_LOCALE` flipped to `"hi"`; `FirstLaunchLanguageViewModel._selectedTag` initial state `"hi"`. ADR-0018 committed.
- **AC-4** Noto Sans Devanagari bundled at `res/font/noto_sans_devanagari.ttf` (OFL-1.1) and wired into design-system `Typography` as Devanagari fallback for headline + title roles.
- **AC-5** Paparazzi goldens recorded on CI Linux for every newly-localized screen in both EN and HI variants. Local Windows record forbidden per `docs/patterns/paparazzi-cross-os-goldens.md`.
- **AC-6** Detekt rule (custom or `ForbiddenComment`) forbids `Text\("[A-Z]` literals outside `res/values/`. Baseline added; new code fails.
- **AC-7** TalkBack content descriptions use `stringResource` so HI locale narration is HI.

### E13 — Wallet + No-show closure

- **E13-S01** `GET /v1/wallet/balance` returns `{balanceInPaise, lastUpdatedAt}`; `GET /v1/wallet/ledger?page=&limit=` returns paginated entries; `POST /v1/bookings` accepts optional `applyCredit: boolean` and returns `appliedCreditAmount`. Idempotency-key on credit-apply. ADR-0017 committed.
- **E13-S02** `WalletScreen` shows balance chip on home + dedicated screen with ledger list. Empty / loading / error states. i18n. Paparazzi golden.
- **E13-S03** `CustomerFirebaseMessagingService` adds `NO_SHOW_CREDIT_ISSUED` branch → system tray notification (E11) + in-app banner on bookings list / live-tracking. Wallet chip updates.
- **E13-S04** Booking-summary screen offers "Apply ₹500 credit" toggle; payment intent reduces by credit amount; ledger entry written; Razorpay route recomputed.

### E14 — Trust & Identity Hardening

- **E14-S01** `LiveTrackingScreen` hosts `TrustDossierViewModel`, calls `loadProfile(state.technicianId)` once a tech is assigned, renders `TrustDossierCard(expandedState, compact=false)` below timeline. `ServiceDetailScreen` calls `loadProfile` for recommended/area tech (server returns top-confidence id) instead of hardcoded `Unavailable`. `BookingConfirmedScreen` shows dossier only if assigned (otherwise hides card).
- **E14-S02** `ServiceDetailViewModel` calls `FusedLocationProviderClient.getLastLocation()` (one-shot, ACCESS_FINE_LOCATION already declared) before invoking `getConfidenceScore`. Fallback to `(0.0, 0.0)` if GPS denied. Methodology bottom-sheet copy localized to HI.
- **E14-S03** `BiometricGateUseCase` injected into `PriceApprovalViewModel.onConfirm`, `BookingViewModel.confirmBooking` (online-payment path only), and new `DeleteAccountUseCase` (E15-S02). PIN fallback when `HardwareAbsent`. Hindi strings.
- **E14-S04** `SessionManager.signOut()` becomes the single source of truth and executes in order: `firebaseAuth.signOut()` → `FirebaseMessaging.unsubscribeFromTopic("customer_${uid}").await()` → `FirebaseMessaging.deleteToken().await()` → `idTokenCacheScope.cancel()` → `clearPrefs()`. Test: after sign-out, `firebaseAuth.currentUser == null` and the topic is unsubscribed.

### E15 — DPDP Self-Service

- **E15-S01** Settings → Privacy & data → "Download my data" calls `GET /v1/users/me/data-export`, saves the JSON via Storage Access Framework, shows success toast with file location. Hindi strings.
- **E15-S02** Settings → Privacy & data → "Delete account" opens a confirmation screen requiring typed `DELETE MY ACCOUNT` (locale-aware — accept the HI equivalent too). Biometric gate before submission. On submit, calls `POST /v1/users/me/erasure-request`, navigates to a 7-day cool-off countdown screen with a "Revoke deletion" CTA that calls `DELETE /v1/users/me/erasure-request/{id}`. ADR-0012 cross-referenced.

### E16 — Catalogue v2 + Booking hardening

- **E16-S01** `POST /v1/bookings` validates `addressLatLng` against an Ayodhya GeoJSON polygon stored at `api/src/data/service-area-ayodhya.geojson`. Reject with `400 SERVICE_NOT_AVAILABLE_AT_LOCATION`. Polygon source: 25 km circle around Ramkot, refined by op. Threat-model row T-B1 added.
- **E16-S02** `GET /v1/services/{id}/availability?date=YYYY-MM-DD` returns `{slots: [{window: "HH:MM-HH:MM", available: boolean}]}`. Slot-conflict locking via Cosmos `_etag` on a `slot_holds` doc. 30 s soft-hold on `POST /v1/bookings`.
- **E16-S03** `CategoryCard` and `ServiceCard` (`ui/catalogue/`) replaced with `AsyncImage`-based photo cards from Firebase Storage CDN URLs. Service-detail hero pulls from CDN, local drawable only as offline fallback. 13 service photos + 5 category photos commissioned. Paparazzi goldens.
- **E16-S04** `AddressScreen` integrates Places SDK: `PlacesClient.findAutocompletePredictions` with Ayodhya `RectangularBounds`, `hi` locale bias. Marker made draggable; reverse-geocode on drag-end. Out-of-area shows localized "We don't serve this area yet" + signup CTA. Saved-address book chips above text field.
- **E16-S05** `SlotPickerScreen` calls `GET /v1/services/{id}/availability`, filters past-time on today, shows "unavailable" greyed out. Soft-hold released on back-navigation.

### E17 — Active-job closeout

- **E17-S01** `GET /v1/bookings/{id}` projects `photos: { stage: { urls: string[] } }` using Firebase Admin signed URLs (5-min TTL). `reportSignedUrl` returned when `status == COMPLETED` and PDF exists. DTOs extended.
- **E17-S02** Tech-app: `LocationForegroundService` started on transition to `EN_ROUTE`/`REACHED`/`IN_PROGRESS`, stopped on `COMPLETED`/`CANCELLED`. `FusedLocationProviderClient` at 30 s interval, posts to `POST /v1/technicians/active-job/{id}/location`. ADR-0019 committed (battery posture, FOREGROUND_SERVICE_LOCATION permission). API rate-limits 1/15s/tech; emits `LOCATION_UPDATE` FCM data message to `customer_{customerId}`. Threat-model row D-L1.
- **E17-S03** `LiveTrackingViewModel` adds `lastUpdateAt: Long` + `tickerFlow(1.seconds)` → derived `isLocationStale = now - lastUpdateAt > 3.minutes`. UI: "Updated 2 min ago" pill + amber warning when stale + `MapPlaceholder` re-shown when stale > 5 min. Tech-identity card: photo + name + rating + verified badge + masked-call button + Trust Dossier link. ETA pill renders "Calculating ETA…" when null.
- **E17-S04** Photo-carousel composable below timeline, grouped by stage (before/during/after). Tap → lightbox screen with pinch-zoom. Localized stage labels.
- **E17-S05** `BookingCompletedScreen` (or extend `BookingConfirmedScreen`) shows "Download service report" CTA when `reportSignedUrl != null`. In-app PDF viewer via `pdfium-android` (OSS) or `Intent.ACTION_VIEW` on signed URL. `BookingConfirmedScreen` polls `GET /v1/bookings/:id` every 5 s while status == `SEARCHING`, listens for `BOOKING_STATUS_UPDATE` FCM, auto-routes to `LiveTrackingScreen` on `ASSIGNED`.

### E18 — Post-service polish + security

- **E18-S01** `BookingCard` for CLOSED/COMPLETED shows `"बुकिंग को रेट करें"` + `"शिकायत दर्ज करें"` buttons. Rating button hidden if `ratingSubmitted == true` (requires adding `ratingSubmitted` flag to `CustomerBooking` DTO + projection).
- **E18-S02** `ComplaintScreen` Success state renders live `CountdownChip` reading `acknowledgeDeadlineAt` → `slaDeadlineAt` after `ACKNOWLEDGED`. New `ComplaintListScreen` reachable from profile/support. Reopen button when `status == RESOLVED`.
- **E18-S03** Shield bottom-sheet copy moved to HI strings (per spec verbatim). Tip-chip `TODO(C-19)` marker added with code reference to `AwaitingPartner` post-submit state. ADR-0024 documents the ≤2★ vs <3★ decision (recommend narrowing to ≤2★ unless launch-review math demands broader, with PostHog event to monitor).
- **E18-S04** `BookingSummaryScreen` `LaunchedEffect` guards `BuildConfig.RAZORPAY_KEY_ID.isBlank()`. Release build fails compile if env var missing. New `BookingUiState.PaymentFailed(orderId, amount, reason)` with retry CTA that re-opens Razorpay on the same `orderId` (Razorpay supports retry until capture).
- **E18-S05** `ProfileScreen` adds: avatar (upload via Firebase Storage), email-edit (verification email), saved-addresses list with edit/delete, notification toggles per channel, "Manage payment methods" row → Razorpay customer portal. Hindi.
- **E18-S06** `AppNavigation` calls `Sentry.setUser(User(id = sha256(uid).take(16)))` on `Authenticated`; `setUser(null)` on `Unauthenticated`. `NavController.OnDestinationChangedListener` adds breadcrumbs. PostHog client initialized (or ADR-0022 deferring it).

---

## Rollout strategy & soft-launch gates

### Pre-launch gate (after Week 6)
All flags off. Internal QA on a debug build with flags forced on. Validate:
- 6 happy paths: catalogue → book → pay → tech-assigned → tracking → completion → rating → wallet credit applied → next booking
- 4 sad paths: payment failure + retry, tech no-show + credit + rebook, complaint + SLA breach + reopen, SOS countdown + cancel within 30 s
- Hindi parity audit: walk every screen with system locale = HI
- DPDP: full data-export → erasure → revoke cycle
- TalkBack walk-through on Hindi locale on a sub-₹10k handset

### Soft-launch gate (controlled exposure, ~25 F&F bookings)
Flip flags in this order (each held for 24h with Sentry + PostHog observation):
1. `customer.service-area-gating.enabled` (warn-only first, fail second)
2. `customer.tray-notifications.enabled`
3. `customer.dpdp-self-service.enabled` (Play Store policy)
4. `customer.biometric-gate.required` (with PIN fallback)
5. `customer.wallet.visible` + `customer.photo-first-catalogue.enabled` (paired — both touch home)
6. `customer.places-autocomplete.enabled` + `customer.periodic-location.enabled`
7. Marketing-pause toggle stays on; `marketing.soft-launch` flag flips per launch-checklist criteria (≥1 verified tech per active serviceId in Ayodhya per the E10-S04 gate).

### Public-launch gate
- ≥2 verified techs per active serviceId in Ayodhya radius
- Field-test Hindi comprehension with ≥3 customers + ≥3 techs (per E10-S04 AC, captured in `docs/launch-readiness/hindi-field-test-2026-XX.md`)
- Sentry crash-free-sessions > 99.5% over 72h
- FCM delivery rate (PostHog) > 95% over 72h
- DPDP request test executed end-to-end

---

## Definition of done (per story — non-negotiable, all tiers)

Mirrors `CLAUDE.md` per-story protocol:
1. TDD red → green → refactor; test file committed before implementation file
2. Pre-Codex smoke gate green: `bash tools/pre-codex-smoke.sh customer-app` / `api` / `technician-app`
3. Codex review passed (`.codex-review-passed` marker before push)
4. `/security-review` for auth/payment/PII/dispatch stories (E13-S04, E14-S03, E14-S04, E15-S01, E15-S02, E16-S01, E17-S02, E18-S04)
5. Paparazzi goldens recorded on CI Linux (never local Windows)
6. CI ship.yml green (lint + tests + Semgrep + ≥80% coverage)
7. Story file frontmatter status → `merged`; AC checkboxes ticked
8. PR uses commit-message format `feat(E##-S##): description`

### Definition of done (per epic)
- All stories merged
- ADRs (if any) merged
- Threat-model rows merged (if any)
- Feature flag created in GrowthBook and defaulted to `off`
- One end-to-end manual smoke run on the epic's primary user journey
- `docs/launch-checklist.md` row updated

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hindi sweep mechanical errors (broken strings, ICU plural drift) | Medium | High (silent UX rot) | Detekt rule forbidding `Text\("[A-Z]`; Paparazzi HI goldens; native-speaker review of ≥top-30 strings |
| Periodic location push battery drain on low-end devices | Medium | Medium (tech-side complaint) | 30 s interval not 10 s; foreground-service notification opt-out unsupported by Android (good); WorkManager fallback if FG service killed; opt-in toggle for tech |
| Razorpay route re-config for credit-application breaks payouts | Low | High (tech earnings hit) | E13-S04 dry-run in test mode; shadow-write credit_applied for 1 week before going live; reconciliation cron alerts on mismatches |
| Service-area gating false negatives (real Ayodhya customer rejected) | Medium | High (lost booking) | Soft-launch flag warn-only first; PostHog event on every reject; manual polygon refinement over week 1 |
| Trust Dossier wiring causes layout breakage on small devices | Low | Medium | Paparazzi goldens on `Pixel 4a` + `Galaxy A05` profiles; LongMethod composables broken up |
| Biometric gate locks out users without hardware (Class-3) | Medium | High (auth deadlock) | PIN fallback; respect `HardwareAbsent` result; session-fresh-N-min escape hatch (ADR) |
| FCM tray notification permission denial on Android 13+ | High | Medium (lost delivery) | Permission-rationale flow on first launch; in-app banner fallback for critical types; PostHog event on denial |
| DPDP erasure cascade misses a Cosmos container | Medium | High (regulatory) | `dpdp-data-inventory.test.ts` already asserts schema; extend test to cover all 10 containers + the new wallet container |
| Photo commissioning slips (E16-S03 blocker) | Medium | Low (story-level only) | Feature flag stays off until assets land; placeholder asset commits unblock dev |
| E11 spec assumption drift during execution | Low | High (rework) | Lock E11 spec at week-1 start; any deviation requires ADR |

---

## Verification plan

### Per-story (handled by smoke gate + Codex)
- TDD coverage proves the contract
- Codex review catches regressions and PII leaks
- Paparazzi catches visual regressions

### Per-epic (manual)
- Run epic's primary user journey end-to-end on a debug build with feature flag forced on
- Capture screenshots in EN + HI for the launch-readiness folder
- Verify no Sentry errors in the test session

### Pre-soft-launch (system-level)
- Run `docs/launch-checklist.md` top-to-bottom; every row green
- Field test in Ayodhya (≥3 customer + ≥3 tech) per E10-S04 gate; capture comprehension feedback in `docs/launch-readiness/`
- Full DPDP request cycle (export → erasure → revoke) on a real account
- Battery-drain test on tech-app over a 4-hour active session (target: ≤ 10% drain)
- 24h soak with all flags on and synthetic load: verify FCM delivery > 95%, crash-free-sessions > 99.5%

---

## Critical files to modify (path map)

### customer-app
- `customer-app/app/src/main/AndroidManifest.xml` — `homeservices://` intent-filter on MainActivity; `FOREGROUND_SERVICE_LOCATION` not added (tech-side only)
- `customer-app/app/src/main/kotlin/com/homeservices/customer/HomeservicesCustomerApplication.kt` — `NotificationChannel` creation; Places SDK init
- `customer-app/app/src/main/kotlin/com/homeservices/customer/firebase/CustomerFirebaseMessagingService.kt` — branches for `NO_SHOW_CREDIT_ISSUED`, `ERASURE_FINAL_NOTICE`, `ERASURE_DENIED`; tray-notification builder; deep-link `PendingIntent`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/AppNavigation.kt` — Sentry user binding; nav breadcrumbs
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/auth/SessionManager.kt` — `signOut()` becomes orchestrator; Firebase + FCM + IdTokenCache cleanup
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/locale/LocaleRepositoryImpl.kt` — DEFAULT_LOCALE → `"hi"`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/observability/SentryInitializer.kt` — already initialized; just bind user in AppNavigation
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/auth/AuthScreen.kt` — i18n
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt` — i18n + Trust Dossier + tech-identity + stale + photo carousel
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingViewModel.kt` — `lastUpdateAt` + ticker
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosViewModel.kt` — encrypted-file upload (E11-S05b-2); permission state branch
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosBottomSheet.kt` + `SosConsentDialog.kt` — i18n + police-info card
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/AddressScreen.kt` — Places + draggable pin + service-area + i18n
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/SlotPickerScreen.kt` — API-driven
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingSummaryScreen.kt` — Razorpay key guard + biometric + apply-credit toggle
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingConfirmedScreen.kt` — live-progress polling + conditional Trust Dossier
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/PriceApprovalScreen.kt` + `PriceApprovalViewModel.kt` — biometric + currency
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/bookings/CustomerBookingsScreen.kt` — i18n + Rate/Complaint CTAs + no-show banner + pill colour scheme
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt` + `ServiceListScreen.kt` + `ServiceDetailScreen.kt` — photo-first + Trust Dossier preview + add-on toggle + search wiring
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/ConfidenceScoreRow.kt` — i18n + real GPS pill
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintScreen.kt` + `ComplaintViewModel.kt` — i18n + SLA countdown + history list + reopen
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt` + `RatingViewModel.kt` — i18n + shield Hindi + tip-chip marker
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/shared/TrustDossierCard.kt` — already exists; wire into screens
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt` + `ProfileViewModel.kt` — DPDP entry + editable fields
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/settings/SettingsScreen.kt` — DPDP section
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/wallet/` — **new package**: `WalletScreen.kt`, `WalletViewModel.kt`, `LedgerEntryRow.kt`, `WalletRoutes.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/dpdp/` — **new package**: `DataExportScreen.kt`, `DeleteAccountScreen.kt`, `CoolOffCountdownScreen.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/wallet/`, `domain/wallet/` — **new packages**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/dpdp/`, `domain/dpdp/` — **new packages**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/auth/BiometricGateUseCase.kt` — already built; inject into VMs
- `customer-app/app/src/main/res/values/strings.xml` + `values-hi/strings.xml` — ~120 new keys
- `customer-app/app/src/main/res/font/noto_sans_devanagari.ttf` — **new**
- `customer-app/app/build.gradle.kts` — Places import; Razorpay key release-time guard; pdfium-android dep

### api
- `api/src/functions/bookings.ts` — `applyCredit` accept; service-area gating; photos + reportSignedUrl projection
- `api/src/functions/sos.ts` + `api/src/services/fcm.service.ts` — payload enrichment (`customerName`, `addressLatLng`); SOS off-topic device-token
- `api/src/functions/wallet.ts` — **new**: `GET /v1/wallet/balance`, `GET /v1/wallet/ledger`
- `api/src/functions/services-availability.ts` — **new**: `GET /v1/services/{id}/availability`
- `api/src/functions/active-job-location.ts` — **new**: `POST /v1/technicians/active-job/{id}/location`
- `api/src/services/service-area.service.ts` — **new**: Turf.js polygon check
- `api/src/data/service-area-ayodhya.geojson` — **new**: Ayodhya polygon
- `api/src/schemas/booking.ts` — extend response schemas
- `api/src/schemas/wallet.ts` — **new**
- `api/src/repositories/customer-credit-repository.ts` — extend with balance + ledger queries

### technician-app
- `technician-app/app/src/main/kotlin/com/homeservices/technician/data/location/LocationForegroundService.kt` — **new**
- `technician-app/app/src/main/AndroidManifest.xml` — `FOREGROUND_SERVICE_LOCATION` + service declaration

### docs
- `docs/adr/0017-customer-wallet-ledger.md`, `0018-hindi-default-customer-app.md`, `0019-periodic-tech-location.md`, `0020-service-area-gating.md`, `0024-rating-shield-threshold.md` (optional), `0022-posthog-otel-deferral.md` (optional)
- `docs/threat-model.md` — append rows S-W1, D-L1, T-B1
- `docs/stories/E13-*.md` through `E18-*.md` — story files per template
- `docs/superpowers/plans/2026-05-1{1..6}-*.md` — per-story plans
- `docs/launch-checklist.md` — update soft-launch + public-launch criteria
- `docs/stories/README.md` — append E11/E13-E18 rows + dependency graph
- `customer-app/CLAUDE.md` — mention new packages + i18n discipline
- `docs/patterns/i18n-stringresource-discipline.md` — **new** pattern doc capturing the Hindi sweep lessons

### CI / tooling
- `tools/pre-codex-smoke.sh` — already exists; add detekt rule check
- New custom detekt rule: `NoHardcodedComposeText` forbidding `Text\("[A-Z]` outside test sources
- `.github/workflows/customer-ship.yml` — extend coverage to wallet + dpdp packages
- `.github/workflows/paparazzi-record.yml` — extend matrix for HI locale

---

## Verification plan (end-to-end)

After Week 6 exit:

1. **Build + smoke**
   - `bash tools/pre-codex-smoke.sh customer-app` → 0
   - `bash tools/pre-codex-smoke.sh api` → 0
   - `bash tools/pre-codex-smoke.sh technician-app` → 0
2. **CI green** on `main` for all sub-projects
3. **Manual user-journey walkthrough** on debug build (flags forced on)
   - Sign in (Truecaller failure path) → first-launch HI picker → catalogue (photos) → service detail (Trust Dossier visible) → slot (real availability) → address (Places autocomplete, Ayodhya only) → biometric → Razorpay → confirmation (live progress) → tracking (tech identity card, moving pin, ETA) → price-approval (biometric) → tech completes → photo carousel + PDF download → rating (HI shield) → complaint optional (SLA countdown) → wallet credit (no-show edge) → rebook with credit applied → DPDP export → delete account → revoke
4. **Battery + perf** — 4-hour soak: ≤ 10% tech-side drain; ≤ 1.8 s cold-start on Pixel 4a debug build
5. **Sentry / PostHog observation** — 24h: crash-free-session > 99.5%, FCM delivery > 95%
6. **TalkBack walkthrough** in HI locale on a sub-₹10k device — all CTAs read in Hindi

---

## 4-week aggressive variant (if launch date pressure)

Drop these to Phase 2 / post-launch:
- E15-S02 revoke-deletion flow (keep delete-account but defer 7-day countdown UI; rely on server-side cool-off)
- E16-S03 photo-first catalogue (ships uglier on Day 1, fix Week 7)
- E17-S04 photo carousel (defer to Week 7)
- E18-S05 profile editable fields (keep DPDP rows only)
- E18-S06 PostHog (defer with ADR-0022)
- E11-S06-fail (keep S06-warn only; promote later)

Resulting scope: ~25 stories, 20 dev-days, achievable in 4 weeks with the same parallel-stream cadence. P0+P1 essentials all shipped; the deferred items are P1 polish.

---

## Open decisions surfaced for owner

1. **E11-S05b-2 SOS audio** — Option A (encrypted Firebase Storage upload, 7-day TTL, owner can listen) vs Option B (local-only). **Plan defaults to Option A** because PRD says "encrypted on device" implies eventual upload for owner-review. Confirms threat-model S-A1 mitigation. Override if Option B preferred.
2. **Rating shield threshold** — `<3★` (PRD wording) vs `≤2★` (current code). **Plan defaults to keeping `≤2★`** (avoid alert fatigue) but commits ADR-0024 documenting the choice. Override if Day-1 launch-review math demands `<3★`.
3. **PostHog vs ADR-0022 deferral** — full PostHog instrumentation (~10 funnels) vs deferring all product analytics to Phase 2. **Plan defaults to ship PostHog minimal taxonomy** because soft-launch insight is too valuable to skip; ADR-0022 only if budget rejects.
4. **6-week vs 4-week** — Plan defaults to 6 weeks for enterprise quality. 4-week variant available if hard launch date.
5. **Cross-app coordination overhead** — E17-S02 (periodic location) and the FCM-payload extensions force tech-app + API + customer-app churn in the same sprint. **Plan defaults to bundling** because customer-side gap is structurally unfixable otherwise.

---

## Definition of done — overall plan

- All 39 stories merged on main
- All ADRs (0017-0020 mandatory, 0021/0022 if chosen) merged
- Threat-model rows S-W1 + D-L1 + T-B1 merged; S-A1 marked mitigated
- Hindi sweep Paparazzi goldens recorded on CI Linux
- `docs/launch-checklist.md` rows all green
- Sentry + PostHog (or ADR-0022) dashboards configured
- Soft-launch flag flippable; rollback plan exercised in dry-run
- Customer-app gap audit (`docs/audit/customer-app-gap-audit-2026-05-11.md`) re-run by spawning the same 6-slice audit → ≤ 5 remaining P2 findings, 0 P0/P1

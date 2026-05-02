# E11 — Durable Screen Hooks (Epic Spec)

**Status:** Brainstorm complete · awaiting owner spec-review · awaits writing-plans
**Date:** 2026-05-01
**Owner:** Alok Tiwari
**Review trail:** Brainstorm with Claude Opus 4.7 → adversarial review by OpenAI Codex CLI 0.125.0 (briefing: `docs/superpowers/specs/.codex-briefings/2026-05-01-e11-decomposition-review.md`)
**Touches:** `customer-app/`, `technician-app/`, `api/`

---

## 1. Design Goal

> Every implemented screen must have at least one durable entry point. **Events only wake the app. Backend state decides which screen the user can reach.**

The four entry-path categories that satisfy "durable":

1. **Workflow path** — a normal-UI navigation lineage from home/dashboard.
2. **Event/push/deep-link path** — FCM data message → tray notification → typed deep-link URI.
3. **Resume/fallback path** — a card on home/dashboard surfaces unresolved state if the user missed the push.
4. **App-start reconciliation** — backend `/me/pending-actions` rebuilds the local view on cold start.

A screen counts as **hooked** iff: reachable in foreground, after app restart, from a normal UI state if push was missed, and it fetches current backend state before sensitive actions.

---

## 2. Locked Architectural Decisions

### 2.1 Pending actions are a *durable action index*, not entity source-of-truth

- Persisted Cosmos collection `pending_actions`, partition key `/userId`.
- Deterministic id: `<TYPE>:<role>:<userId>:<entityType>:<entityId>` — idempotent upserts.
- **Source entity is always re-fetched on screen entry.** The action row is a discovery/reachability handle, not the truth about the booking/job/rating itself.
- Dashboard counters and recent-bookings lists stay computed-on-read from source collections; promotion to denormalized only if RU budget forces it.

### 2.2 Local store: Room (per-app)

- `pending_actions` table mirrors the API row plus `lastFetchedAt` and `version`.
- Indexes on `status`, `type`, `expiresAt`, `priority`, `createdAt`.
- DAO methods: `upsertAll`, `markMissingAsResolved` (tombstones), `observeActive`, `findById`, `markResolved`, `purgeExpired`, `purgeTombstones` (30d), `clearAll` (logout).

### 2.3 Routes: sealed `AppRoute` + Compose Nav 2.8 typed serialization

- Compose Navigation 2.8.9 already on classpath in both apps — no version bump needed.
- `kotlinx-serialization` plugin added in S01a as a spike with rollback path.
- Per-app `AppRoute` sealed hierarchy with `@Serializable` data classes; spec returns app-local `RouteSpec` enum implementing shared `RouteSpec` interface.

### 2.4 Reconciliation triggers (4)

1. Cold start after auth.
2. Home/dashboard `onResume`.
3. FCM data-message receipt.
4. Pull-to-refresh on home/dashboard.

Server response evicts local rows missing from response. Local store is a cache + notification bridge — never authority.

### 2.5 Deep links

- FCM data-message extras → `homeservices://action/<TYPE>?<args>` URI.
- HTTPS App Links (Digital Asset Links) deferred — no domain ownership yet.

### 2.6 Initial-route priority ladder (6 tiers)

```
T0 GATE          unauthenticated → AuthRoute
T1 BLOCKING      tech KYC ∈ {NOT_STARTED, INCOMPLETE} → KycRoute
                 (KYC ∈ {SUBMITTED, MANUAL_REVIEW, COMPLETE} → dashboard with KYC card; not blocked)
T2 LIVE_OPS      tech active job ∈ {ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS} → ActiveJobRoute
                 customer booking AWAITING_PRICE_APPROVAL → PriceApprovalRoute
                 (Asymmetry: tech is contractually obligated; customer is not.
                  Customer ServiceTracking is NOT T2 — surfaces as home card; tap-driven only.)
T3 HIGH_ACTION   JOB_OFFER (unexpired), SAFETY_SOS_FOLLOWUP (future)
T4 NORMAL_ACTION KYC_RESUME, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP
T5 LOW_ACTION    RATING_PROMPT_CUSTOMER, RATING_PROMPT_TECHNICIAN, RATING_RECEIVED, EARNINGS_UPDATE
T6 DEFAULT       role-specific home/dashboard
```

Tie-break within tier: earliest non-null `expiresAt` → oldest `createdAt` → lexicographic `id`.

### 2.7 Foreground FCM never auto-navigates

```
on FCM receipt while foreground:
    parse → ingest (upsert + version check)
    if currentTopRoute.spec == route(intent).spec && currentTopRoute.entityId == intent.entityId:
        if screen.isDirty && !screen.canSilentMerge:
            → emit IngestEvent.RefreshAvailable (banner)
        else:
            → emit IngestEvent.SourceRefreshNeeded (silent)
    else if action.priority == HIGH:
        → persistent banner with "View now" CTA
    else:
        → home/dashboard cards observe Flow; no banner
```

User tap is the only navigation trigger from foreground FCM.

### 2.8 Component split (single responsibility)

- **`NotificationRouter`** — parses FCM data + deep-link URIs into `NotificationIntent`. Pure parser. Builds `PendingIntent` for tray notifications.
- **`PendingActionStore`** — Room persistence. No network, no parse.
- **`PendingActionIngestor`** — orchestrator: receives `NotificationIntent`, fetches source if payload incomplete, **performs version-aware upsert**, emits foreground events.

### 2.9 Strict ordering invariant — projector

Every projector path: `upsert(action) → emit(fcm)`. Never emit FCM without a successful upsert. Enforced via Semgrep rule + tests.

### 2.10 Stale-event resurrection rule (Codex flag — strengthened in verify pass)

**Two mechanisms together:**

**(a) Version comparison.** Every `pending_actions` row carries `version: long` + `updatedAt: long`. Server bumps `version` monotonically. Ingestor compares incoming payload's `version` against existing row's `version`:
- `incoming.version > existing.version` → upsert.
- `incoming.version <= existing.version` → drop (idempotent no-op + `pending_action_stale_drop` log).

**(b) Tombstones.** RESOLVED rows are NOT deleted from the local store on reconcile. Reconcile renames `deleteMissingFromServer` → `markMissingAsResolved`: rows present locally but missing from server response are flagged `status = RESOLVED`, `resolvedAt = now`. RESOLVED rows are purged by **`purgeTombstones`** only after `30 days` (TTL > FCM max delivery TTL of 28 days). `purgeExpired` is a separate method that handles ACTIVE rows whose `expiresAt` has passed (e.g., `JOB_OFFER` TTL).

**Why both:**
- A late-arriving FCM with the SAME id as an existing-but-resolved tombstone hits the `existing.status == RESOLVED → drop` rule.
- A late-arriving FCM with a NEW id (no existing row) — would otherwise upsert via mechanism (a)'s `existing == null` path. The 30-day tombstone window means there can never be a "new id" arrival for an action older than 30 days.
- For belt-and-suspenders: when `existing == null`, ingestor calls `api.confirmActive(id)` before upsert. 404 → drop + log.

**Combined ingestor rule:**
```
if existing != null && existing.status == RESOLVED → drop
if existing != null && incoming.version <= existing.version → drop
if existing == null:
    if not api.confirmActive(incoming.id) → drop
    upsert
else upsert
```

Without all three checks, a late FCM after the row was server-resolved would resurrect a resolved action. **Critical for correctness.**

### 2.11 Dirty-state merge contract (Codex flag)

Every screen that consumes `IngestEvent.SourceRefreshNeeded` must implement `DirtyStateMerger`:

```kotlin
interface DirtyStateMerger {
    fun isDirty(): Boolean
    fun canSilentMerge(freshSource: SourceEntity): Boolean  // false if user input would be wiped
}
```

Coordinator's silent-vs-banner decision (§2.7) consults this. If unsafe to merge silently, show "Refresh available" banner with explicit user tap.

---

## 3. Shared Contracts

### 3.1 `core-nav` module (pure Kotlin, no Android dependencies)

```kotlin
// shared across both apps
interface RouteSpec { val name: String }

enum class PendingActionType {
    ADDON_APPROVAL_REQUESTED,    // existing FCM type — customer
    RATING_PROMPT_CUSTOMER,       // existing — customer
    RATING_PROMPT_TECHNICIAN,     // existing — tech
    RATING_RECEIVED,              // existing — tech
    EARNINGS_UPDATE,              // existing — tech
    JOB_OFFER,                    // existing — tech
    KYC_RESUME,                   // new — tech
    COMPLAINT_UPDATE,             // new — both
    SUPPORT_FOLLOWUP,             // new — both
    SAFETY_SOS_FOLLOWUP           // future
}

enum class PendingActionStatus { ACTIVE, RESOLVED, EXPIRED }
enum class PendingActionPriority { HIGH, NORMAL, LOW }

data class PendingAction(
    val id: String,
    val userId: String,
    val role: String,                       // "customer" | "technician"
    val type: PendingActionType,
    val entityType: String,
    val entityId: String,
    val routeUri: String,                   // homeservices://action/...
    val priority: PendingActionPriority,
    val status: PendingActionStatus,
    val sourceStatus: String?,
    val version: Long,                      // monotonic; for stale-drop check
    val createdAt: Long,
    val updatedAt: Long,
    val expiresAt: Long?,
    val resolvedAt: Long?
)

data class NotificationIntent(
    val type: PendingActionType,
    val entityId: String,
    val rawArgs: Map<String, String>
)

object DeepLinkUri {
    fun build(intent: NotificationIntent): String
    fun parse(uri: String): NotificationIntent?
}

interface NotificationRouter {
    fun parseFcmData(data: Map<String, String>): NotificationIntent?
    fun parseDeepLink(uri: String): NotificationIntent?
}

interface RouteResolver {
    suspend fun decideInitialRoute(ctx: RouteContext): RouteSpec
    fun routeFor(action: PendingAction): RouteSpec
    fun routeFor(intent: NotificationIntent): RouteSpec
}

data class RouteContext(
    val authState: AuthState,
    val role: String,
    val activeActions: List<PendingAction>,
    val techKycStatus: String?,
    val techActiveJob: ActiveJobSummary?,
    val customerActiveBookings: List<BookingSummary>
)

// pure tier-ladder logic — unit-testable, no Android deps
object TierLadder {
    fun resolve(ctx: RouteContext): RouteSpec
}
```

### 3.2 Per-app — customer-app

```kotlin
enum class CustomerRouteSpec : RouteSpec {
    Home, Auth, ServiceTracking, BookingPriceApproval, Rating, Complaint, /*…*/
}

sealed interface CustomerRoute { val spec: CustomerRouteSpec }

@Serializable
data class BookingPriceApprovalRoute(val bookingId: String) : CustomerRoute {
    override val spec get() = CustomerRouteSpec.BookingPriceApproval
}
// … one @Serializable per route
```

### 3.3 Per-app — technician-app

```kotlin
enum class TechnicianRouteSpec : RouteSpec {
    Dashboard, Auth, Onboarding, Kyc, JobOffer, ActiveJob, MyRatings, Earnings, Complaint, /*…*/
}

sealed interface TechnicianRoute { val spec: TechnicianRouteSpec }
// … one @Serializable per route
```

### 3.4 Per-app Room schema

```kotlin
@Entity(
    tableName = "pending_actions",
    indices = [Index("status"), Index("type"), Index("expiresAt"), Index("priority"), Index("createdAt")]
)
data class PendingActionEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val role: String,
    val type: String,
    val entityType: String,
    val entityId: String,
    val routeUri: String,
    val priority: String,
    val status: String,
    val sourceStatus: String?,
    val version: Long,
    val createdAt: Long,
    val updatedAt: Long,
    val expiresAt: Long?,
    val resolvedAt: Long?,
    val lastFetchedAt: Long
)

@Dao interface PendingActionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(rows: List<PendingActionEntity>)

    @Query("UPDATE pending_actions SET status = 'RESOLVED', resolvedAt = :now WHERE id NOT IN (:keep) AND userId = :userId AND status = 'ACTIVE'")
    suspend fun markMissingAsResolved(userId: String, keep: Set<String>, now: Long)

    @Query("SELECT * FROM pending_actions WHERE userId = :userId AND status = 'ACTIVE' ORDER BY priority DESC, createdAt ASC")
    fun observeActive(userId: String): Flow<List<PendingActionEntity>>

    @Query("SELECT * FROM pending_actions WHERE id = :id LIMIT 1")
    suspend fun findById(id: String): PendingActionEntity?

    @Query("UPDATE pending_actions SET status = 'RESOLVED', resolvedAt = :now WHERE id = :id")
    suspend fun markResolved(id: String, now: Long)

    /** Purge ACTIVE rows whose TTL has passed (e.g., JOB_OFFER). RESOLVED tombstones are protected — see purgeTombstones. */
    @Query("DELETE FROM pending_actions WHERE status = 'ACTIVE' AND expiresAt IS NOT NULL AND expiresAt < :now")
    suspend fun purgeExpired(now: Long)

    /** Tombstone purge: RESOLVED rows older than 30 days. TTL > FCM max delivery TTL (28d). */
    @Query("DELETE FROM pending_actions WHERE status = 'RESOLVED' AND resolvedAt IS NOT NULL AND resolvedAt < :cutoff")
    suspend fun purgeTombstones(cutoff: Long)

    @Query("DELETE FROM pending_actions")
    suspend fun clearAll()
}
```

### 3.5 Per-app `PendingActionIngestor`

```kotlin
class PendingActionIngestor(
    private val store: PendingActionStore,
    private val api: PendingActionApi,
    private val events: MutableSharedFlow<IngestEvent>
) {
    suspend fun ingest(intent: NotificationIntent) {
        val incoming = if (intent.hasFullPayload()) intent.toAction()
                       else api.fetchById(idFor(intent)) ?: return
        val existing = store.findById(incoming.id)
        when {
            existing != null && existing.status == "RESOLVED" -> {
                log("pending_action_resolved_drop", incoming.id); return
            }
            existing != null && incoming.version <= existing.version -> {
                log("pending_action_stale_drop", incoming.id, existing.version, incoming.version); return
            }
            existing == null && !api.confirmActive(incoming.id) -> {
                log("pending_action_unknown_drop", incoming.id); return
            }
        }
        store.upsert(incoming)
        events.emit(IngestEvent.Inserted(incoming))
    }

    suspend fun reconcile(userId: String) {
        val server = api.list(userId)
        store.upsertAll(server)
        store.markMissingAsResolved(userId, server.map { it.id }.toSet(), now = clock.now())
        store.purgeExpired(now = clock.now())
        store.purgeTombstones(cutoff = clock.now() - 30.days.inWholeMillis)
    }

    suspend fun markResolvedFromFcm(id: String) = store.markResolved(id)
}

sealed class IngestEvent {
    data class Inserted(val action: PendingAction) : IngestEvent()
    data class SourceRefreshNeeded(val entityId: String) : IngestEvent()
    data class RefreshAvailable(val entityId: String) : IngestEvent()
}
```

---

## 4. Data Flow

### 4.1 Cold start

```
1. MainActivity.onCreate
2. AuthSession.getCurrent()
   ├─ null → AuthRoute (T0). STOP.
   └─ valid → continue
3. PendingActionIngestor.reconcile(userId)
4. Source-state probes (parallel; only what T1–T2 need):
   ├─ tech: GET /v1/technicians/me/kyc/status
   ├─ tech: GET /v1/technicians/active-job/* (try by current booking if known)
   └─ customer: GET /v1/customers/me/bookings?status=active
5. RouteResolver.decideInitialRoute(ctx) — pure TierLadder.resolve
6. NavigationCoordinator.navigateTo(route, popUpToHome = true)
```

Offline at step 3 → skip server reconcile, decide route from local Room snapshot, banner indicates stale.

### 4.2 FCM data message — foreground

```
1. AppFirebaseMessagingService.onMessageReceived(msg)
2. NotificationRouter.parseFcmData(msg.data) → NotificationIntent
3. PendingActionIngestor.ingest(intent)        // includes version check
4. IngestEvent emitted (per §2.7 rule):
   - if top route matches and screen is dirty + can't merge → RefreshAvailable banner
   - if top route matches and screen can merge → SourceRefreshNeeded silent
   - if HIGH priority → persistent banner
   - else → cards observe Flow; no banner
5. Never auto-navigate from FCM in foreground.
```

### 4.3 FCM data message — background

```
1. AppFirebaseMessagingService.onMessageReceived(msg)
2. NotificationRouter.parseFcmData → NotificationIntent
3. PendingActionIngestor.ingest        // upsert into Room
4. NotificationRouter.buildPendingIntent(intent) → PendingIntent
   (deep-link URI: homeservices://action/<TYPE>?<args>)
5. NotificationManagerCompat.notify(channelForType(intent.type), notification)
```

### 4.4 Notification tap — cold launch

```
1. PendingIntent fires → MainActivity.onCreate(savedInstanceState=null) with deep-link Uri
2. Run normal cold-start steps 1–5 (§4.1)
3. NavigationCoordinator.handleColdStartIntent(intent):
   ├─ NotificationRouter.parseDeepLink(uri) → NotificationIntent
   ├─ T0/T1 still apply — auth + KYC blocking gates win even on tap
   └─ navigate to RouteResolver.routeFor(intent)
```

### 4.5 Notification tap — hot

```
1. NewIntent → MainActivity (singleTask launchMode)
2. NavigationCoordinator.handleHotIntent(intent):
   ├─ parse deep link
   ├─ if currentTopRoute interruptibility = LOW (mid-payment/photo-upload) → defer + show banner
   └─ else navigate
```

### 4.6 User resolves the action

```
1. Screen submits to source endpoint
2. API mutates source entity → change feed → projector → row resolved server-side via ETag/IfMatch (§S02)
3. Two reconciliation paths:
   a. FCM "action_resolved" data message → Ingestor.markResolvedFromFcm(id)
   b. Next reconcile() — server omits resolved rows; markMissingAsResolved tombstones the local row
   c. Tombstones (status=RESOLVED) are kept locally for 30 days, then purgeTombstones drops them
```

### 4.7 Logout / cross-user residue cleanup (Codex flag)

```
on logout:
    1. PendingActionStore.clearAll()
    2. FirebaseMessaging.deleteToken()
    3. FcmTopicSubscriber.unsubscribeAll()
    4. PendingActionIngestor cancel any in-flight reconcile()
    5. AuthSession.clear()
on next login as different user:
    fresh reconcile() rebuilds local store
```

---

## 5. Story-by-story Scope

### E11-S01a — Android infra contracts (Foundation, Opus plan)

**Scope:**
- New `core-nav` Gradle module (pure Kotlin): `RouteSpec` interface, `PendingActionType`, `PendingActionStatus`, `PendingActionPriority`, `PendingAction`, `NotificationIntent`, `DeepLinkUri` builder/parser, `NotificationRouter` interface, `RouteResolver` interface, `RouteContext`, `TierLadder` pure-function ladder logic.
- Per-app: `PendingActionEntity` + DAO + Room database + `PendingActionStore` impl + Hilt module.
- **Spike sub-task (first thing in plan):** add `kotlinx-serialization` plugin to both apps' `libs.versions.toml`; convert 1 simple route + 1 arg route per app to `@Serializable`; verify `composable<T>()` + `entry.toRoute<T>()`; run Paparazzi smoke.

**Hard go/no-go on the spike (Codex):**
- Spike completes with **explicit owner-visible go/no-go decision** at end of S01a plan execution.
- **If go:** S01b plan is written using typed `@Serializable` routes.
- **If no-go:** S01b is **frozen**. A fallback ADR is written (`docs/adr/00XX-route-contract-fallback.md`) choosing sealed-class string routes. **No mid-story pivot during S01b.** S01b plan-write does not begin until the fallback ADR is committed.

**Work streams:**
- WS-A `core-nav` contracts + `TierLadder` (parallel to WS-B; pure Kotlin; Sonnet subagent OK after Opus plan).
- WS-B per-app Room layer (parallel to WS-A; both apps in parallel via 2 Sonnet subagents).
- WS-C spike — kotlinx-serialization + 2 routes + Paparazzi smoke. Owner-visible go/no-go gate before S01b.
- WS-D pre-Codex smoke gate + Codex review.

**Test surface:**
- `TierLadder` unit tests — every T0–T6 path + tie-break combinations.
- `DeepLinkUri.build/parse` round-trip (incl. URL encoding edge cases).
- Room schema migration test (empty → seeded → query → eviction).
- DAO query correctness (priority ordering, expiry filter, tombstone purge at 30d).

**Acceptance:**
- `core-nav` module compiles, exports 12 contract types.
- Both apps wire Room database via Hilt, DI graph compiles.
- Spike: `BookingPriceApprovalRoute(bookingId="bk123")` round-trips through Compose Nav; Paparazzi golden recorded.
- **Owner-signed go/no-go decision recorded** (or fallback ADR committed if no-go).

**Out of scope:** NotificationRouter Android adapter (S01b-1), FCM service refactor (S01b-1), route migration (S01b-2).

---

### E11-S01b — pre-split into S01b-1 + S01b-2 (Codex verify pass)

S01b is **pre-committed to a 2-story split**. Codex flagged the "split if over 1500 lines" deferral as the same rationalization as the original S01 deferral.

---

### E11-S01b-1 — Router + Ingestor + FCM + cold-start (Foundation, Opus plan)

**Scope:**
- Per-app `NotificationRouter` Android adapter (parses `RemoteMessage` → delegates to `core-nav` parser).
- Per-app `PendingActionIngestor` orchestrator with full stale-event ruleset (§2.10): version compare + tombstone check + `confirmActive` belt-and-suspenders.
- Customer-app: refactor existing `CustomerFirebaseMessagingService` to delegate to Ingestor.
- Tech-app: refactor existing `HomeservicesFcmService` to delegate to Ingestor.
- Cold-start integration in both `MainActivity`s (auth → reconcile → tier ladder → coordinator).
- **Android 13+ `POST_NOTIFICATIONS` runtime permission flow** (Codex): request on first FCM-relevant screen view. Denied → degrade gracefully (in-app cards stay; no tray notifications). Permission state observable so Coordinator can adjust banner intensity.

**Work streams:**
- WS-A NotificationRouter adapter + Ingestor (after S01a, with go decision). Sonnet subagent per app.
- WS-B FCM service refactor (parallel with WS-A).
- WS-C Cold-start integration (`MainActivity` + `AppNavigation`); after WS-A.
- WS-D POST_NOTIFICATIONS permission flow + degradation path.
- WS-E pre-Codex smoke gate + Codex review.

**Test surface:**
- `Ingestor.ingest` full ruleset: RESOLVED tombstone drop, version stale drop, unknown-id `confirmActive` 404 drop, fresh upsert.
- `Ingestor.reconcile` semantics: marks-missing-as-resolved, purges expired, purges 30-day tombstones.
- Cold-start integration test (instrumentation): unauth → AuthRoute; tech KYC NOT_STARTED → KycRoute; tech with active job → ActiveJobRoute.
- Foreground FCM banner-vs-silent-refresh decision (with dirty-state merger).
- POST_NOTIFICATIONS denied → tray suppressed, in-app cards still render.
- POST_NOTIFICATIONS granted → tray notifications work end-to-end.

**Acceptance:**
- Both apps cold-start through tier ladder.
- FCM in foreground/background routes through Ingestor.
- POST_NOTIFICATIONS request flow + denied-path degradation observable.

**Out of scope:** route migration codemod (S01b-2), event-bus removal (S01b-2), logout cleanup wiring (S01b-2).

---

### E11-S01b-2 — Route migration + event-bus removal + logout cleanup (Foundation, Opus plan)

**Scope:**
- **Route migration codemod (Haiku-suitable):** convert all existing routes in customer-app + tech-app to typed `@Serializable` form (or sealed-class strings if S01a fallback ADR active). Listed targets in §9.
- **Explicit removal of the 7 event-bus files (6 distinct types — `RatingPromptEventBus` exists in both apps):**
  - `customer-app/.../data/booking/PriceApprovalEventBus.kt`
  - `customer-app/.../data/rating/RatingPromptEventBus.kt`
  - `customer-app/.../data/tracking/TrackingEventBus.kt`
  - `technician-app/.../data/jobOffer/JobOfferEventBus.kt`
  - `technician-app/.../data/earnings/EarningsUpdateEventBus.kt`
  - `technician-app/.../data/rating/RatingPromptEventBus.kt`
  - `technician-app/.../data/rating/RatingReceivedEventBus.kt`
  - Replace each consumer with `PendingActionStore.observeActive` filtered by relevant type, plus `IngestEvent` flow collection where foreground reactivity is needed.
- **Logout cleanup wiring** (§4.7): `PendingActionStore.clearAll()` + `FirebaseMessaging.deleteToken()` + topic unsubscribe in `LogoutUseCase`.

**Work streams:**
- WS-A Route migration codemod (Haiku subagent; mechanical sweep).
- WS-B Event-bus removal (Haiku-then-Sonnet — codemod removes injection sites, Sonnet replaces consumers).
- WS-C Logout cleanup integration.
- WS-D pre-Codex smoke gate + Codex review.

**Test surface:**
- All routes round-trip through typed `@Serializable` form.
- Every prior consumer of each event bus compiles + observes via Ingestor/Store.
- Logout clears store + FCM token + topics; verified by integration test.

**Acceptance:**
- All 7 event-bus files deleted from the codebase.
- Logout leaves no `pending_actions` rows + no FCM topic subscriptions + no FCM token.
- Codex review passes; CI green.

**Depends on:** S01b-1 (router/ingestor wiring must exist before consumers can migrate to it).

---

### E11-S02 — Backend pending-actions + observability (Foundation, Opus plan)

**Scope — endpoints:**

| Method | Path | Status | Notes |
|---|---|---|---|
| GET | `/v1/customers/me/pending-actions` | new | filter status=ACTIVE + expiresAt>now |
| GET | `/v1/technicians/me/pending-actions` | new | same |
| GET | `/v1/customers/me/bookings?status=...` | partial | confirm in `bookings.ts`; computed-on-read |
| GET | `/v1/technicians/me/dashboard` | new aggregator | KYC + active-job + pending-offer + today's earnings + today's ratings |
| GET | `/v1/technicians/active-job/{bookingId}` | exists | `active-job.ts:117` — no change |
| PATCH | `/v1/technicians/me/availability` | **new — net-new endpoint** | replaces local-only toggle |

**Cosmos:**
- New collection `pending_actions`, partition key `/userId`.
- Composite index `(userId, status, expiresAt)` for hot read.
- Indexes on `priority`, `createdAt`, `type`.
- Zod schema `api/src/schemas/pendingActions.ts`.
- **`version` field is monotonic int.** Bumped on every mutation by projector via Cosmos optimistic concurrency:
  ```
  1. read row by id (returns _etag)
  2. compute new state; new_version = existing.version + 1 (skip bump if mutation is semantic no-op)
  3. replace with header IfMatch: <_etag>
  4. on 412 Precondition Failed → re-read + retry (max 3 attempts, exponential backoff)
  5. on 5xx → emit pending_action_upsert_failed log; do NOT call sendFcm; rely on next change-feed retry
  ```
- **No version inflation:** if a change-feed event would set the same logical state (e.g., booking transitioned through a state then back to same state), `upsertAction` returns the existing row unchanged.

**Projector triggers (5 source adapters; one shared harness):**

| Adapter | Source collection | `PendingActionType` emitted (must match enum in §3.1) |
|---|---|---|
| `bookings` | `bookings` (existing change feed) | `ADDON_APPROVAL_REQUESTED`, `RATING_PROMPT_CUSTOMER`, `COMPLAINT_UPDATE` |
| `ratings` | `ratings` | `RATING_RECEIVED` |
| `kyc` | `kyc_submissions` | `KYC_RESUME` |
| `dispatch_attempts` | `dispatch_attempts` (NOT `job_offers`) | `JOB_OFFER` |
| `complaints` | `complaints` (existing — `complaints-repository.ts`) | `COMPLAINT_UPDATE` |

(Naming aligned with existing FCM wire types per §9.2 and §3.1 enum. **No invented type names.**)

**Shared harness (single file `services/pending-action-projector.ts`):**
- `upsertAction(action)` — version-bumping idempotent upsert via ETag/IfMatch (above).
- `resolveAction(id)` — sets status=RESOLVED, bumps version (same ETag flow).
- `expireAction(id)` — sets status=EXPIRED, bumps version.
- **Strict ordering helper:** `await upsertAction(); await emitFcm()` — never reverse.

**Semgrep rule:** in any file matching `trigger-projector-*.ts`, fail CI if `sendFcm()` is called before `upsertAction()` in the same function body.

**Observability acceptance criteria (Codex flag):** structured logs at:
- `pending_action_upsert` (id, version, action_type, projector_source)
- `pending_action_stale_drop` (id, existing_version, incoming_version) — client-side
- `fcm_send_attempt` (action_id, target_user_id)
- `fcm_send_success` (action_id, ms_elapsed)
- `fcm_send_failure` (action_id, error_code) — does not retry inline; relies on next reconcile()

Logs shipped via existing OpenTelemetry pipeline (per `api/src/observability/`).

**Work streams:**
- WS-A Cosmos collection + Zod schema + indexes + RU budget probe.
- WS-B Projector harness + 5 source adapters (parallel — fan out 5 Sonnet subagents after harness).
- WS-C Read API + dashboard aggregator + availability PATCH.
- WS-D Auth middleware audit (cross-user 403 tests on every endpoint).
- WS-E Semgrep rule + observability logs.
- WS-F pre-Codex smoke gate + Codex review.

**Test surface:**
- Duplicate change-feed events → idempotent upsert (no version inflation).
- Stale-state cleanup (booking moves AWAITING_PRICE_APPROVAL → PAID → projector resolves `ADDON_APPROVAL_REQUESTED`).
- Expiry (`dispatch_attempts` TTL passes → `JOB_OFFER` action expired by background timer).
- Cross-user 403 (user B fetches user A's actions).
- FCM-after-upsert ordering (Semgrep rule fires on inverted code).
- `version` monotonicity under concurrent writes (412 retry path under simulated contention).
- Semantic-no-op mutation does NOT bump version.
- Read API filters resolved/expired correctly.

**Acceptance:**
- All 6 endpoints respond with correct shapes.
- All 5 projectors observed during integration test (synthetic state transitions trigger correct upserts).
- Semgrep rule ships and fires.
- Structured logs visible in OTel.
- ETag retry path verified under contention test.

---

### E11-S03 — Customer home durable hooks (Feature, Sonnet plan)

**Scope:**
- Replace `CatalogueHomeScreen` → `CustomerHomeScreen` with state-driven sections:
  1. **Pending actions stack** (top 3 by priority) — observes `PendingActionStore.observeActive(role=customer)`.
  2. **Active booking card(s)** — observes `BookingsRepository.observeActive()` via `GET /v1/customers/me/bookings?status=active`. Tap → `ServiceTrackingRoute` (or `BookingPriceApprovalRoute` if applicable).
  3. **Recent bookings list** (last 5 completed) — entry to Rating, Complaint, Receipt.
  4. **Catalogue sections** (existing) — below state-driven sections.
- ViewModel implements `DirtyStateMerger` (returns `false` for `isDirty()` — home is read-only, always silent-merge OK).
- Paparazzi goldens (CI Linux only) for: empty state, with-pending-actions, with-active-booking, with-recent-bookings, full state.

**Test surface:**
- ViewModel state composition (3 Flows merged correctly).
- Pending action card tap → correct `routeFor(action)`.
- Active booking card tap → tracking vs price-approval branching.

**Out of scope:** SOS, trust dossier, confidence score (see S05b-1, S05b-2).

---

### E11-S04 — Technician dashboard durable hooks (Feature, Sonnet plan)

**Pre-req hygiene (first task in plan):** Fix `ActiveJobResponse.id` mismatch — Android expects `id`, API returns `bookingId`. Either rename Android field or adjust API response. Owner pick at plan-write; default to API-side rename to `id` for consistency. Codex flagged this as an existing bug worth fixing before E11 builds on it.

**Scope:**
- Replace `HomeGraph` landing → `TechnicianDashboardScreen` with sections:
  1. Availability toggle — round-trips `PATCH /v1/technicians/me/availability` (real, not local-only).
  2. KYC status card (only shown if status ∈ {SUBMITTED, MANUAL_REVIEW, COMPLETE}; NOT_STARTED/INCOMPLETE blocks at T1).
  3. Current assignment card — observes `DashboardRepository.observe()`. Tap → `ActiveJobRoute(bookingId)`.
  4. Pending offer card — TTL countdown; observes `PendingActionStore` filtered by `JOB_OFFER`.
  5. Pending rating prompt card — `RATING_PROMPT_TECHNICIAN`.
  6. Earnings summary chip → tap to existing earnings screen.
  7. Ratings summary chip → tap to existing my-ratings screen.
  8. Support entry → complaints.
- ViewModel implements `DirtyStateMerger` (always silent-merge OK).
- Paparazzi goldens.

**Test surface:** dashboard composition; availability PATCH integration; pending-action card filtering by type; KYC card visibility.

---

### E11-S05a — Tech job execution hooks (Feature, Sonnet plan)

**Scope:**
- IN_PROGRESS active-job screen gains "Request add-on" CTA. Endpoint exists (`POST /v1/bookings/{id}/request-addon` at `bookings.ts:109`).
- After call succeeds, screen shows "Waiting for customer approval" pending banner. Source state remains `AWAITING_PRICE_APPROVAL`; the **pending-action TYPE** is `ADDON_APPROVAL_REQUESTED` (existing FCM wire type, projected into customer's pending actions by the bookings projector).
- Complaint entry from active-job (in-progress + completed) and from rating-receive screen → existing `Complaint` route (already exists).

**Test surface:** add-on request UX (CTA visibility on IN_PROGRESS only; "waiting" banner after submission); complaint entry navigation.

**Note:** Codex correction — I was wrong to invent a new source state. Use existing `AWAITING_PRICE_APPROVAL` source state; the action TYPE is the discovery handle.

---

### E11-S05b-1 — Customer trust dossier + confidence (Feature, Sonnet plan)

**Scope:**
- `TrustDossierCard` accepts nullable `technicianId: String?`. If null, render `PlatformTrustCard` (service-level + platform-level trust badges; no fake tech avatar; no "unavailable technician" placeholder).
- Confidence score conditional load — only fetch when `assignedTechnicianId` exists. Surfaces on assigned-booking + tracking only; NOT on generic catalogue browsing.

**Test surface:** trust dossier null-vs-present rendering; confidence-score fetch conditional.

---

### E11-S05b-2 — Customer SOS audio truth-up (Feature, Sonnet plan, OWNER-BLOCKED)

**Owner decision required at plan-write time:**

- **Option A — wire upload:** SOS recording (`filesDir/sos/sos-<bookingId>.m4a`) uploads to Firebase Storage at `bookings/{bookingId}/sos/{technicianUid}/<timestamp>.m4a`. Storage rules amended (currently only allow photos at `bookings/{bookingId}/photos/...` per `firebase/storage.rules:18`). Encrypt-at-rest (existing default). 7-day TTL via Cloud Function or scheduled cleanup. ADR documents privacy + storage cost.
- **Option B — copy fix:** change `SosConsentDialog` copy from "You can attach a short local audio recording to help owner support review the situation" (at `SosConsentDialog.kt:17`) to "Recording stays on this device for your reference. It will not be uploaded." Delete `MediaRecorder` upload-path code.

**Scope (after owner picks):**
- Implement chosen option.
- Update existing `triggerSos` API consumer (`SosUseCase.kt`) to pass storage path if Option A.
- Test surface depends on option.

**Codex flag:** existing app records locally but never uploads. Current copy implies attachment. **This is a real bug** — must be resolved one way or another.

---

### E11-S05c — Onboarding placement (Feature, Sonnet plan)

**Scope:**
- T1 ladder update: `if (tech.firstRun && tech.kycStatus == NOT_STARTED) → OnboardingRoute → KycRoute`. Persist `onboardingShownAt` in DataStore (or post to `POST /v1/technicians/me/onboarding-completed` if owner wants server-side tracking; default local).
- Ladder paths tested: fresh signup (Onboarding → KYC), returning incomplete-KYC (skip Onboarding → KYC), returning manual-review (dashboard with KYC card), returning complete (dashboard).

---

### E11-S06-warn — Static reachability gate (warn-only mode) (Foundation, Sonnet plan)

**Scope:**
- Gradle task `:reachabilityCheck` per app, runs on every PR.
- Reflects on:
  1. `AppRoute` sealed hierarchy (every leaf type).
  2. `AndroidManifest.xml` deep-link `<intent-filter>` entries.
  3. `PendingActionType` enum.
  4. NavGraph composable bindings (extracted via KSP or AST scan of `AppNavigation.kt` + graph files).
  5. Per-app `WorkflowEntries.kt` declaration (manual list of `RouteSpec → entry-from-screen` pairs).
- For each `AppRoute` leaf, asserts ≥1 of: workflow entry, `PendingActionType → routeFor` mapping, deep-link filter, dashboard pending-action mapping.
- **Warn-only mode:** logs missing reachability to CI output; does NOT fail build.

**Suppression workflow (Codex):**
- File path: `<app>/reachability-suppressions.txt` (committed; one per app).
- Line format: `<RouteName> <expiry-date-iso> <author-handle> <reason>`
- **Rules:**
  - Only the project owner (`Alok Tiwari`) may add or extend a suppression. PR author cannot self-suppress.
  - PR adding a suppression must include co-review by owner (squash-merge requires owner-approved review).
  - **Default expiry: 14 days.** Maximum allowed: 30 days. Longer requires explicit owner-written ADR.
  - Expired entries fail CI (warn mode) **loudly** — i.e., CI step exits 0 but with `##[error]` annotation visible in the PR check.
  - Suppressions audited monthly (cron job opens issue listing all active suppressions and their expiries).

**Acceptance:** runs on every PR; emits warnings; suppressions file in place with the workflow above; no build failures from missing reachability yet.

**Out of scope:** runtime "fetches current backend state before sensitive action" — that's a per-story acceptance criterion + code-review checklist.

---

### E11-S06-fail — Static reachability gate (promote to fail mode) (Foundation, Sonnet plan)

**Scope:**
- Promote `:reachabilityCheck` from warn-only to fail mode.
- Audit `app/reachability-suppressions.txt` — every entry must have explicit owner sign-off and a future expiry; expired entries cause CI fail.
- Add `:reachabilityCheck` to `ship.yml` required checks.

**Acceptance:** PR with unreachable route fails CI; PR with valid suppression passes; expired suppression fails CI.

---

## 6. Error/Edge Handling

| Case | Handling |
|---|---|
| Duplicate FCM (same `messageId` or same deterministic action id) | Deterministic id + version check → idempotent (§2.10) |
| Action expired between server-fetch and user-tap | Screen opens, fetches source, sees mismatch → renders "no longer needed" + auto-pop after 2s; local row resolved on next reconcile |
| Source state moved on (booking auto-cancelled by no-show while approval pending) | Same as above — screen is the reconciliation point |
| Offline cold start | Skip reconcile; local store drives `decideInitialRoute`; banner indicates stale; retry on connectivity restore |
| Race: FCM "new" + reconcile fetching at same time | Both upsert with same id; **version check** ensures last-writer-with-higher-version wins |
| Cross-user residue after logout | `clearAll()` on logout (§4.7); reconcile after re-login restores fresh |
| Stale-event resurrection (FCM arrives after server resolved) | **§2.10 three-mechanism rule:** RESOLVED tombstone drop OR version stale drop OR `confirmActive` 404 drop |
| FCM arrives 30+ days after row resolved + tombstone purged | `confirmActive` belt-and-suspenders — ingestor's `existing == null` branch hits API; 404 → drop |
| Same logical state mutation re-fired by change feed | `upsertAction` semantic-no-op skip — no version inflation (§S02) |
| ETag conflict on concurrent projector writes | Re-read + retry (max 3 attempts); on persistent failure → `pending_action_upsert_failed` log + skip FCM |
| Dirty UI input + foreground SourceRefreshNeeded | `DirtyStateMerger.canSilentMerge` returns false → show "Refresh available" banner instead of silent reload (§2.11) |
| Notification tap during low-interruptibility screen (mid-payment) | Coordinator defers navigation; shows banner instead (§4.5) |
| User taps low-tier action while T0/T1 gate would apply (unauth, KYC-blocked) | Gate wins; tapped action stays in store; nudge user post-gate |
| FCM token rotated mid-session | Server-side projector targets userId, not token; new token registered on next FCM init; no action lost |

---

## 7. Testing Strategy

### 7.1 Unit (per story)

- `core-nav` — `TierLadder.resolve` exhaustive (every T0–T6 path × tie-break dimensions); `DeepLinkUri` round-trip incl. URL encoding.
- `Ingestor` — version-aware stale drop; reconcile eviction; markResolvedFromFcm idempotency.
- DAO — query correctness (priority order, expiry filter).
- Per-app ViewModels — state composition; DirtyStateMerger contract honored.

### 7.2 Instrumentation (S01b)

- Cold start → tier ladder → coordinator: unauth + KYC-blocked + active-job + active-booking + pending-action paths.
- Foreground FCM → banner-vs-silent-refresh decision.
- Hot deep-link tap → defer-vs-navigate decision.
- Logout cleanup leaves no rows / no FCM token / no topic subscriptions.

### 7.3 Backend (S02)

- Idempotency: replay change-feed event 3× → 1 upsert, 1 FCM, version stable.
- Stale-state cleanup: source transitions through projector emit/resolve sequence.
- Expiry: `dispatch_attempts` TTL → `JOB_OFFER` action `EXPIRED`.
- Cross-user 403: every endpoint.
- Semgrep rule fires on inverted FCM-before-upsert code.
- Version monotonicity under concurrent writes.

### 7.4 Reachability gate (S06)

- Warn mode: PR with unreachable route emits CI warning; passes build.
- Fail mode: PR with unreachable route fails CI; valid suppression passes; expired suppression fails.

### 7.5 Acceptance test (epic-level, post-S05c)

- End-to-end: create booking → FCM ADDON_APPROVAL_REQUESTED while customer-app backgrounded → tray notification → tap → AuthGate → cold-start reconcile → tier ladder → PriceApprovalRoute → submit approval → projector resolves → reconcile next time evicts row.

---

## 8. Out of Scope (Deliberate Omissions)

- HTTPS App Links / Digital Asset Links — deferred (no domain).
- Computed-on-read pending actions for dashboard counters — stays computed; promotion only if RU budget forces.
- Runtime "fetch backend state before sensitive action" assertion in S06 — per-story acceptance criterion + code-review checklist only.
- Customer ServiceTracking as Tier 2 — deliberate UX asymmetry (see §2.6).
- Migrating admin-web to typed routes — Next.js routing is separate concern; out of E11.
- Push delivery telemetry beyond the 5 structured logs (§S02 observability) — FCM delivery is best-effort at ₹0.

---

## 9. Pre-Existing Work to Coordinate

### 9.1 Event buses to remove in S01b-2 (7 files / 6 distinct types)

`RatingPromptEventBus` exists in **both** apps — counts as 2 files (1 type).

| # | File | Class |
|---|---|---|
| 1 | `customer-app/.../data/booking/PriceApprovalEventBus.kt` | `PriceApprovalEventBus` |
| 2 | `customer-app/.../data/rating/RatingPromptEventBus.kt` | `RatingPromptEventBus` (customer) |
| 3 | `customer-app/.../data/tracking/TrackingEventBus.kt` | `TrackingEventBus` |
| 4 | `technician-app/.../data/jobOffer/JobOfferEventBus.kt` | `JobOfferEventBus` |
| 5 | `technician-app/.../data/earnings/EarningsUpdateEventBus.kt` | `EarningsUpdateEventBus` |
| 6 | `technician-app/.../data/rating/RatingPromptEventBus.kt` | `RatingPromptEventBus` (technician) |
| 7 | `technician-app/.../data/rating/RatingReceivedEventBus.kt` | `RatingReceivedEventBus` |

Consumers of each bus (`MainActivity.kt`, `AppNavigation.kt`, ViewModels) must be migrated to `PendingActionStore.observeActive` or `IngestEvent` flow.

### 9.2 Existing FCM wire types to reuse (do NOT invent new ones in S01a `PendingActionType` enum)

`ADDON_APPROVAL_REQUESTED`, `RATING_PROMPT_CUSTOMER`, `RATING_PROMPT_TECHNICIAN`, `RATING_RECEIVED`, `EARNINGS_UPDATE`, `JOB_OFFER`. Source: `api/src/services/fcm.service.ts`, `customer-app/.../firebase/CustomerFirebaseMessagingService.kt`, `technician-app/.../data/fcm/HomeservicesFcmService.kt`.

### 9.3 Pre-existing bugs to fix as plan pre-reqs

- **S04 pre-req:** `ActiveJobResponse.id` mismatch (Android `ActiveJobApiService.kt:26` expects `id`; API `active-job.ts:40` returns `bookingId`).
- **S05b-2 pre-req (if Option A):** Storage rules at `firebase/storage.rules:18` only allow `bookings/{bookingId}/photos/...` — must add `bookings/{bookingId}/sos/...` rule.

---

## 10. Open Owner Decisions

1. **S05b-2 SOS audio: Option A (wire upload + ADR + storage rules + TTL) vs Option B (copy fix + delete MediaRecorder code).** Blocks S05b-2 plan-write only; S05b-1 is unblocked.
2. **S04 ActiveJob id-mismatch fix direction:** API rename `bookingId` → `id` (preferred for consistency) vs Android rename `id` → `bookingId` (less risk if API consumers depend on `bookingId`). Decide at S04 plan-write.
3. **S05c onboarding completion tracking:** local DataStore only vs `POST /me/onboarding-completed` server-side. Default local; flip if owner needs analytics on it.

---

## 11. References

- **Codex briefings (audit trail):** `docs/superpowers/specs/.codex-briefings/2026-05-01-e11-decomposition-review.md` (first pass) + `docs/superpowers/specs/.codex-briefings/2026-05-01-e11-final-verify.md` (verify pass)
- **Sprint roadmap:** `docs/stories/README.md`
- **Architecture:** `docs/architecture.md`
- **PRD:** `docs/prd.md`
- **Pattern library:**
  - `docs/patterns/firebase-callbackflow-lifecycle.md` (relevant for FCM service refactor)
  - `docs/patterns/hilt-module-android-test-scope.md` (cross-module DI for `core-nav`)
  - `docs/patterns/paparazzi-cross-os-goldens.md` (S03/S04/S05* visual goldens)

---

## 12. Story Order & Cadence (post-Codex verify)

**12 stories total** after Codex's S01b pre-split:

```
Wave 1 (parallel):  S01a, S02
Wave 2:             S01b-1 (depends on S01a's go decision OR fallback ADR)
Wave 3:             S01b-2 (depends on S01b-1)
Wave 4 (parallel):  S03, S04, S05a, S05c, S06-warn (all depend on S01b-2 + S02 except S05c which only needs S01b-2)
Wave 5 (parallel):  S05b-1 (depends on S03), S05b-2 (owner-blocked)
Wave 6:             S06-fail (depends on S05c + S06-warn)
```

Each story enters its own brainstorm + plan + execute cycle per project CLAUDE.md per-story protocol. Foundation stories (**S01a, S01b-1, S01b-2, S02**) get fresh sessions for plan-writing per CLAUDE.md security/cross-cutting trigger.

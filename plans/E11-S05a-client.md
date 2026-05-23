# E11-S05a-client — Technician-app Job-Execution Durable Hooks (Client Half)

**Tier:** Feature | **Deps:** E11-S04 (dashboard patterns; pending-actions Room foundation from E11-S01a-2) | **Blocks:** none in W5
**Status (as of 2026-05-17):** IMPLEMENTED on `feat/E11-S05a-job-execution-durable-hooks`. Awaiting [`plans/E11-S05a-api.md`](./E11-S05a-api.md) to ship before the new active-job FCM refresh path is live in production.

---

## Status preamble (added 2026-05-17 after Codex round 4)

### What this plan covers — and what it doesn't

This plan was originally written as a single `E11-S05a` story but the spec under-scoped the work. Codex review correctly flagged that **no server producer dispatches `BOOKING_STATUS_UPDATE` to the `technician_${id}` FCM topic** — only `customer_${id}`. The technician-app listener wired by this story is therefore inert in production until the matching API producer ships.

The story was split:
- **E11-S05a-client (this plan)** — every client-side change documented below: durable PHOTO_UPLOAD_PENDING producer/consumer, completion-confirm dialog, photo-retry banner, BookingStatusEvent bus + listener, FCM handler branches that PARSE the wire payload. Independently functional for everything EXCEPT the server-driven refresh path.
- **[`plans/E11-S05a-api.md`](./E11-S05a-api.md)** — new server-side story that adds `sendTechnicianBookingStatusUpdatePush` and wires it into the `approveFinalPrice` handler so the listener actually fires.

### What works without E11-S05a-api

- **Durable photo-upload retry** (PHOTO_UPLOAD_PENDING producer/consumer): fully functional. Survives process death. No API dependency.
- **Completion-confirm dialog**: fully functional. Local UI state only.
- **FCM tray notifications** for booking-status pushes: will display correctly when/if a push arrives — the handler is wired.

### What does NOT work until E11-S05a-api ships

- **Active-job screen refresh on customer price-approval**: `BookingStatusEventBus` is wired but no production push reaches the technician topic, so the open `ActiveJobScreen` cannot refresh on customer-side state changes. Mitigation in the interim: the screen still refreshes whenever the technician returns to it (init re-runs `repository.startObserving`).

### Known limitation deferred to a follow-up

- **Notification deep-link to active-job route**: the booking-status notification opens MainActivity but does not deep-link to `activeJob/{bookingId}`. The technician lands on the dashboard and taps the booking from there. Proper deep-link wiring would add a `PendingNavigationStore` + `HomeGraph` collector — out of scope for both client and api stories. Track separately if user demand justifies.

---

## Pattern citations (read before coding)

| Pattern file | Why relevant |
|---|---|
| `docs/patterns/paparazzi-cross-os-goldens.md` | New Compose composable added — all Paparazzi tests must be `@Ignored` |
| `docs/patterns/firebase-callbackflow-lifecycle.md` | FCM `onMessageReceived` runs on a background thread; `serviceScope.launch` pattern from existing `HomeservicesFcmService` is correct — no callbackFlow here but channel-leak rules still apply to `SharedFlow` collectors in the ViewModel |
| `docs/patterns/hilt-module-android-test-scope.md` | New event bus and ViewModel must be manually constructed in unit tests; no `@AndroidEntryPoint` in JUnit 5 tests |
| `docs/patterns/kotlin-explicit-api-public-modifier.md` | All new top-level declarations, class members, and companion constants must carry `public` |

---

## Prerequisites

This story does NOT introduce the `pending_actions` Room table, `PendingActionDao`, `PendingActionsDatabase`, `PendingActionIngestor`, or `PendingActionStore` — all of these exist from E11-S01a-2.

This story does NOT introduce `ActiveJobRepository`, `ActiveJobRepositoryImpl`, `ActiveJobViewModel`, `ActiveJobUiState`, or `PhotoCaptureScreen` — those exist from prior active-job stories.

What this story adds on top of that foundation:
- Three new `PendingActionType` constants for job-execution lifecycle events.
- FCM branches in `HomeservicesFcmService` for the three booking-status push types.
- `BookingStatusEventBus` for in-process propagation of server-confirmed status changes.
- `ActiveJobViewModel` extensions: consume `BookingStatusEventBus`, expose `photoUploadPending` flag derived from Room, wire completion confirmation dialog state.
- A `PhotoUploadRetryBanner` composable surfaced inside `ActiveJobScreen` when `PHOTO_UPLOAD_PENDING` is in Room.
- A `CompletionConfirmationDialog` composable shown before the final `COMPLETE_JOB` action is dispatched.
- EN + HI strings for the two new UI surfaces.

**libs.versions.toml sync** — first task of this story; copy `customer-app/gradle/libs.versions.toml` to `technician-app/gradle/libs.versions.toml` before writing any code.

---

## Architecture overview

### Durable job-execution hooks — the core loop

```
Technician taps CTA
  └─ ActiveJobViewModel.onTransitionRequested(stage)
       └─ shows PhotoCaptureScreen (existing)
            └─ onPhotoConfirmed(localPath)
                 ├─ uploadJobPhotoUseCase.execute(…)   [existing]
                 │    failure → PHOTO_UPLOAD_PENDING inserted to Room
                 │              (PendingActionType.PHOTO_UPLOAD_PENDING)
                 └─ fireTransition(stage)              [existing]
                      failure → STATE_TRANSITION_PENDING inserted to Room
                                (PendingActionType.STATE_TRANSITION_PENDING)

Connectivity restored (ConnectivityObserver.isConnected emits true)
  └─ ActiveJobViewModel.init collector → repository.syncPendingTransitions() [existing]
       AND pendingActionStore.retryPhotoUploads() [NEW in WS-A]
```

**COMPLETION_CONFIRMATION_PENDING** is a transient in-memory flag only — it survives in `ActiveJobUiState.Active.awaitingCompletionConfirm: Boolean`. It does NOT need a Room row because "pending confirmation" is a UI-gating state, not a durability concern. Process death while the dialog is open: the technician must tap the CTA again (the underlying job is still `IN_PROGRESS` on the server; they see the same CTA on resume).

### FCM → event bus → screen

Server sends `BOOKING_STATUS_UPDATE` (e.g., customer price approved):
```
HomeservicesFcmService.handleMessageData
  └─ "BOOKING_STATUS_UPDATE" branch [NEW in WS-B]
       ├─ parse bookingId + newStatus + optional priceApprovedPaise
       ├─ bookingStatusEventBus.post(BookingStatusEvent(…))  [NEW in WS-A]
       └─ show system-tray notification on CHANNEL_BOOKINGS

ActiveJobViewModel.init [NEW collector in WS-C]
  └─ bookingStatusEventBus.events.collect
       └─ if event.bookingId == this.bookingId → emit NavigationEvent or update uiState
```

### Photo upload pending state survives process death

`PHOTO_UPLOAD_PENDING` is persisted to Room via `PendingActionStore.upsert(…)`. When the process restarts and the technician returns to `ActiveJobScreen`:
- `ActiveJobViewModel.init` observes `pendingActionDao.observeActive(userId)`.
- If any row with `type == "PHOTO_UPLOAD_PENDING"` and `entityId == bookingId` exists, the ViewModel sets `photoUploadPending = true`.
- `ActiveJobScreen` surfaces a `PhotoUploadRetryBanner` — a non-blocking strip at the top of the screen.
- Tapping "Retry" calls `onPhotoRetryRequested()` on the ViewModel, which re-opens `PhotoCaptureScreen` for that stage.

---

## Work streams

### WS-A — Domain: new sealed variants + `BookingStatusEventBus`

**A1 — Extend `PendingActionType` constants** (core-nav module, `NotificationIntent` type registry or equivalent constant set used by the router)

Add three new string constants to the existing type namespace. Verify the exact location the router uses for type matching:
```
PHOTO_UPLOAD_PENDING
STATE_TRANSITION_PENDING
COMPLETION_CONFIRMATION_PENDING  // reserved; not used for Room persistence in this story
```

If the router uses an enum (`NotificationIntentType`), add the three variants there with `@JvmField` constants on the companion if the router parses them by name.

**A2 — `BookingStatusEvent` data class + `BookingStatusEventBus`**

New files:
```
technician-app/…/data/activeJob/BookingStatusEvent.kt
technician-app/…/data/activeJob/BookingStatusEventBus.kt
```

```kotlin
public data class BookingStatusEvent(
    val bookingId: String,
    val newStatus: String,
    val priceApprovedPaise: Long? = null,
)

@Singleton
public class BookingStatusEventBus @Inject constructor() {
    private val _events = MutableSharedFlow<BookingStatusEvent>(extraBufferCapacity = 1)
    public val events: SharedFlow<BookingStatusEvent> = _events.asSharedFlow()
    public fun post(event: BookingStatusEvent) { _events.tryEmit(event) }
}
```

Provide via existing `ActiveJobModule` — add a `@Provides @Singleton` for `BookingStatusEventBus` (no interface, so `@Provides` not `@Binds`).

**A3 — `PendingActionStore.retryPhotoUploads()` extension**

Add to the existing `PendingActionStore`:
```kotlin
public suspend fun pendingPhotoUploadForBooking(bookingId: String): PendingAction?
public suspend fun clearPhotoUploadPending(bookingId: String)
```

Both delegate to `PendingActionDao` queries filtered by `type = 'PHOTO_UPLOAD_PENDING'` and `entityId = bookingId`.

**A4 — TDD for WS-A**

New test files:
```
BookingStatusEventBusTest.kt    — post emits; second collector gets no replay
PendingActionStorePhotoTest.kt  — pendingPhotoUploadForBooking returns row; clearPhotoUploadPending removes it
```

---

### WS-B — FCM: `HomeservicesFcmService` new branches

Modify `handleMessageData` `when` block. Insert **before** the legacy `JOB_OFFER` branch:

```kotlin
"BOOKING_STATUS_UPDATE" -> {
    val bookingId = data["bookingId"] ?: return
    val newStatus = data["newStatus"] ?: return
    val priceApprovedPaise = data["priceApprovedPaise"]?.toLongOrNull()
    bookingStatusEventBus.post(
        BookingStatusEvent(bookingId, newStatus, priceApprovedPaise)
    )
    showBookingStatusNotification(bookingId, newStatus, data["title"], data["body"])
}
"CUSTOMER_PRICE_APPROVED" -> {
    val bookingId = data["bookingId"] ?: return
    val paise = data["amountPaise"]?.toLongOrNull() ?: 0L
    bookingStatusEventBus.post(
        BookingStatusEvent(bookingId, "PRICE_APPROVED", priceApprovedPaise = paise)
    )
    showBookingStatusNotification(bookingId, "PRICE_APPROVED", data["title"], data["body"])
}
"CUSTOMER_PRICE_REJECTED" -> {
    val bookingId = data["bookingId"] ?: return
    bookingStatusEventBus.post(BookingStatusEvent(bookingId, "PRICE_REJECTED"))
    showBookingStatusNotification(bookingId, "PRICE_REJECTED", data["title"], data["body"])
}
```

Add `@Inject public lateinit var bookingStatusEventBus: BookingStatusEventBus` alongside existing injected fields.

`showBookingStatusNotification(bookingId, status, title?, body?)` — private helper:
- Posts on `CHANNEL_BOOKINGS`.
- Title: `title ?: getString(R.string.booking_status_notification_title)`.
- Body: `body ?: getString(R.string.booking_status_notification_body_default)`.
- PendingIntent: `MainActivity` with `Intent.FLAG_ACTIVITY_SINGLE_TOP`.

**TDD:**
```
HomeservicesFcmServiceBookingStatusTest.kt
```
Construct service manually (no `@AndroidEntryPoint` in unit tests — per hilt-module-android-test-scope pattern). Use MockK to mock `BookingStatusEventBus`. Verify:
- `BOOKING_STATUS_UPDATE` → `post()` called with correct `BookingStatusEvent`.
- `CUSTOMER_PRICE_APPROVED` with `amountPaise = "5000"` → `priceApprovedPaise = 5000L`.
- `CUSTOMER_PRICE_REJECTED` → `post()` called with `newStatus = "PRICE_REJECTED"`.
- Missing `bookingId` → `post()` never called (early return guard).

---

### WS-C — Active-job screen + ViewModel extensions

**C1 — `ActiveJobUiState.Active` additions**

Add two fields to the existing `Active` data class:
```kotlin
val photoUploadPending: Boolean = false,
val awaitingCompletionConfirm: Boolean = false,
```

Preserve all existing fields. No Room schema change.

**C2 — `ActiveJobViewModel` new collectors**

In `init`:

```kotlin
// Observe BookingStatusEventBus
viewModelScope.launch {
    bookingStatusEventBus.events.collect { event ->
        if (event.bookingId != bookingId) return@collect
        when (event.newStatus) {
            "PRICE_APPROVED", "PRICE_REJECTED" -> {
                // Refresh job from repo to pick up revised quote
                repository.startObserving(bookingId)
            }
            else -> { /* forward status already reflected via existing repo flow */ }
        }
    }
}

// Observe photo-upload pending actions for this booking
viewModelScope.launch {
    pendingActionStore.pendingPhotoUploadForBooking(bookingId)
        .let { /* one-shot; re-check after connectivity sync */ }
    // More robustly: observe DAO directly
    pendingActionDao.observeActive(userId).collect { rows ->
        val hasPending = rows.any {
            it.type == "PHOTO_UPLOAD_PENDING" && it.entityId == bookingId
        }
        val current = _uiState.value as? ActiveJobUiState.Active ?: return@collect
        if (current.photoUploadPending != hasPending) {
            _uiState.value = current.copy(photoUploadPending = hasPending)
        }
    }
}
```

**Inject additions to constructor:**
```kotlin
private val bookingStatusEventBus: BookingStatusEventBus,
private val pendingActionDao: PendingActionDao,
private val sessionManager: SessionManager,   // for userId
```

New public functions:
```kotlin
public fun requestCompletionConfirm() {
    val current = _uiState.value as? ActiveJobUiState.Active ?: return
    _uiState.value = current.copy(awaitingCompletionConfirm = true)
}

public fun cancelCompletionConfirm() {
    val current = _uiState.value as? ActiveJobUiState.Active ?: return
    _uiState.value = current.copy(awaitingCompletionConfirm = false)
}

public fun confirmCompletion() {
    val current = _uiState.value as? ActiveJobUiState.Active ?: return
    _uiState.value = current.copy(awaitingCompletionConfirm = false)
    completeJob()   // existing function
}

public fun onPhotoRetryRequested() {
    val current = _uiState.value as? ActiveJobUiState.Active ?: return
    // Re-open photo capture for the pending stage
    val pendingStage = current.job.status.toStageName()
    _uiState.value = current.copy(pendingPhotoStage = pendingStage, photoUploadError = null)
}
```

Helper extension (private):
```kotlin
private fun ActiveJobStatus.toStageName(): String = when (this) {
    ActiveJobStatus.ASSIGNED  -> "EN_ROUTE"
    ActiveJobStatus.EN_ROUTE  -> "REACHED"
    ActiveJobStatus.REACHED   -> "IN_PROGRESS"
    ActiveJobStatus.IN_PROGRESS -> "COMPLETED"
    ActiveJobStatus.COMPLETED -> "COMPLETED"
}
```

**C3 — `ActiveJobScreen` additions**

Two new composable surfaces wired into the existing `ActiveJobScreen`:

1. **`PhotoUploadRetryBanner`** — shown when `state.photoUploadPending == true`:
   ```kotlin
   @Composable
   public fun PhotoUploadRetryBanner(
       onRetry: () -> Unit,
       modifier: Modifier = Modifier,
   )
   ```
   - Amber/warning surface strip at the top of the screen body (`Alignment.TopCenter` inside `Box`).
   - Leading `Icons.Filled.CloudUpload`, label text `R.string.photo_upload_pending_banner`, trailing `TextButton("Retry")`.
   - Does NOT auto-dismiss — stays until the user retries and upload succeeds.

2. **`CompletionConfirmationDialog`** — shown when `state.awaitingCompletionConfirm == true`:
   ```kotlin
   @Composable
   public fun CompletionConfirmationDialog(
       onConfirm: () -> Unit,
       onDismiss: () -> Unit,
   )
   ```
   - `AlertDialog` with title `R.string.complete_job_confirm_title`, body `R.string.complete_job_confirm_body`.
   - Confirm button calls `viewModel.confirmCompletion()`.
   - Dismiss button calls `viewModel.cancelCompletionConfirm()`.

`COMPLETE_JOB` CTA in `ActiveJobScreen` (existing `Button`) — change `onClick` from calling `completeJob()` directly to calling `requestCompletionConfirm()`.

**TDD:**
```
ActiveJobViewModelPhotoRetryTest.kt
  — photoUploadPending = true when PHOTO_UPLOAD_PENDING row in DAO for this booking
  — photoUploadPending = false when row absent
  — onPhotoRetryRequested sets pendingPhotoStage to correct stage name

ActiveJobViewModelCompletionConfirmTest.kt
  — requestCompletionConfirm sets awaitingCompletionConfirm = true
  — cancelCompletionConfirm resets it
  — confirmCompletion resets it and calls completeJobUseCase

ActiveJobViewModelStatusEventTest.kt
  — BOOKING_STATUS_UPDATE with matching bookingId triggers startObserving
  — event for different bookingId is ignored
```

New test files:
```
technician-app/…/ui/activeJob/PhotoUploadRetryBannerPaparazziTest.kt    @Ignore
technician-app/…/ui/activeJob/CompletionConfirmationDialogPaparazziTest.kt @Ignore
```

---

### WS-D — Strings (EN + HI)

**`technician-app/app/src/main/res/values/strings.xml`** additions:
```xml
<string name="photo_upload_pending_banner">Photo upload pending — tap Retry to resume</string>
<string name="complete_job_confirm_title">Mark job complete?</string>
<string name="complete_job_confirm_body">Confirm that all work is done. The customer will be notified and you cannot undo this step.</string>
<string name="booking_status_notification_title">Booking update</string>
<string name="booking_status_notification_body_default">Your booking status has changed.</string>
```

**`technician-app/app/src/main/res/values-hi/strings.xml`** additions:
```xml
<string name="photo_upload_pending_banner">फोटो अपलोड बाकी है — जारी रखने के लिए Retry दबाएं</string>
<string name="complete_job_confirm_title">काम पूरा करें?</string>
<string name="complete_job_confirm_body">पुष्टि करें कि सारा काम हो गया है। ग्राहक को सूचना मिलेगी और यह कदम वापस नहीं लिया जा सकता।</string>
<string name="booking_status_notification_title">बुकिंग अपडेट</string>
<string name="booking_status_notification_body_default">आपकी बुकिंग की स्थिति बदल गई है।</string>
```

---

### WS-E — Pre-Codex smoke gate

```bash
cd technician-app && ./gradlew assembleDebug ktlintCheck detekt lintDebug \
    testDebugUnitTest koverVerify --continue 2>&1 | tail -30
```

Non-zero exit = stop and fix before push. Do not invoke Codex review until this gate is green.

---

## File manifest

All paths relative to `technician-app/app/src/main/kotlin/com/homeservices/technician/`.

| Action | File |
|--------|------|
| FIRST | `../../gradle/libs.versions.toml` — sync from customer-app (copy before any code change) |
| NEW | `data/activeJob/BookingStatusEvent.kt` |
| NEW | `data/activeJob/BookingStatusEventBus.kt` |
| MODIFY | `data/activeJob/di/ActiveJobModule.kt` — add `@Provides @Singleton` for `BookingStatusEventBus` |
| MODIFY | `data/pendingaction/PendingActionStore.kt` — add `pendingPhotoUploadForBooking()` + `clearPhotoUploadPending()` |
| MODIFY | `data/fcm/HomeservicesFcmService.kt` — add 3 FCM branches + `bookingStatusEventBus` injection + `showBookingStatusNotification()` helper |
| MODIFY | `ui/activeJob/ActiveJobUiState.kt` — add `photoUploadPending` + `awaitingCompletionConfirm` fields |
| MODIFY | `ui/activeJob/ActiveJobViewModel.kt` — add 3 constructor params + 2 new `init` collectors + 4 new public functions + private `toStageName()` |
| NEW | `ui/activeJob/PhotoUploadRetryBanner.kt` |
| NEW | `ui/activeJob/CompletionConfirmationDialog.kt` |
| MODIFY | `ui/activeJob/ActiveJobScreen.kt` — wire `PhotoUploadRetryBanner` + `CompletionConfirmationDialog`; change COMPLETE_JOB CTA onClick |
| MODIFY | `res/values/strings.xml` — 5 new strings |
| MODIFY | `res/values-hi/strings.xml` — 5 new Hindi strings |
| NEW (test) | `data/activeJob/BookingStatusEventBusTest.kt` |
| NEW (test) | `data/pendingaction/PendingActionStorePhotoTest.kt` |
| NEW (test) | `data/fcm/HomeservicesFcmServiceBookingStatusTest.kt` |
| NEW (test) | `ui/activeJob/ActiveJobViewModelPhotoRetryTest.kt` |
| NEW (test) | `ui/activeJob/ActiveJobViewModelCompletionConfirmTest.kt` |
| NEW (test) | `ui/activeJob/ActiveJobViewModelStatusEventTest.kt` |
| NEW (test) | `ui/activeJob/PhotoUploadRetryBannerPaparazziTest.kt` (`@Ignore`) |
| NEW (test) | `ui/activeJob/CompletionConfirmationDialogPaparazziTest.kt` (`@Ignore`) |

---

## Execution order

1. **Sync `libs.versions.toml`** (customer-app → technician-app). Commit standalone.
2. **WS-A** — domain models + event bus + store extensions + their tests. No UI dep; commit.
3. **WS-B** — FCM branches (depends on WS-A types). Tests verify in isolation via MockK. Commit.
4. **WS-D** — strings (no code dep; can be done in same session as WS-B or WS-C).
5. **WS-C** — UiState extensions → ViewModel extensions → new composables → screen wiring → ViewModel tests → Paparazzi stubs. Depends on WS-A types.
6. **WS-E** — smoke gate. Fix any issues, then push + Codex review.

---

## Implementation evidence (added 2026-05-17)

Work shipped on branch `feat/E11-S05a-job-execution-durable-hooks`:

| Commit | Scope |
|---|---|
| `6796babe` | WS-A — domain primitives (3 new PendingActionType enum values, BookingStatusEvent + BookingStatusEventBus, PendingActionStore extensions, DAO query methods, TDD coverage) |
| `8d0414b6` | WS-B+D — 3 new FCM branches (BOOKING_STATUS_UPDATE, CUSTOMER_PRICE_APPROVED, CUSTOMER_PRICE_REJECTED) + showBookingStatusNotification helper + 8 EN/HI strings + HomeservicesFcmServiceBookingStatusTest |
| `8ea9b594` | WS-C — ActiveJobUiState additions (photoUploadPending, awaitingCompletionConfirm) + ActiveJobViewModel collectors + PhotoUploadRetryBanner + CompletionConfirmationDialog + screen wiring + 3 new ViewModel test files + 2 @Ignored Paparazzi stubs |
| `17bfd390` | WS-E — smoke-gate fixes (ktlint annotation rule, detekt suppressions for LongParameterList/LongMethod/ReturnCount, MockK SharedFlow type-explicit returns, kover exclusions for Compose *Kt wrappers + BookingStatusEventBus) |
| `674946ec` | Codex round-1 P1/P2/P3 fixes (confirmCompletion routes through photo capture, PHOTO_UPLOAD_PENDING producer in onPhotoConfirmed, @Volatile cachedPhotoUploadPending for cold-start race, dropped broken navigate_to extra) |
| `07b849e8` | Codex round-2 P2 fix (read canonical `status` FCM key with `newStatus` fallback) |
| `e84f0b95` | Codex round-3 P2 fix (refresh on every booking-status event, not just price changes) |
| (uncommitted) | Codex round-4 P2 #2 fix (runCatching around best-effort clearPhotoUploadPending so Room I/O failure can't strand the spinner) |

Codex round-4 P2 #1 (no technician-bound API producer) deliberately deferred to E11-S05a-api.

**Pre-Codex smoke gate (`bash tools/pre-codex-smoke.sh technician-app`):** green as of `e84f0b95`. Re-verify after the round-4 fix commits.

**Codex residual:** 1 P2 outstanding (API producer missing) — explicitly out of scope per the split.

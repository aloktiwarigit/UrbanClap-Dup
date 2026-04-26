# Story E07-S05: Discreet Safety SOS

**Status:** ready-for-dev

> **Epic:** E07 — Ratings, Complaints & Safety (`docs/stories/README.md` §E07)
> **Sprint:** S4 (wk 7–8) · **Estimated:** ≤ 1 dev-day · **Priority:** P1
> **Sub-projects:** `api/` + `customer-app/` — no technician-app changes
> **Ceremony tier:** Feature (new API endpoint + new use-case + SOS UI overlay on existing tracking screen; bounded scope; Codex + CI; no `/security-review` unless branch contains PII/auth changes)
> **Prerequisite:** E07-S03 (complaints live) + E09-S05 (audit log live) + E04-S03 (LiveTrackingScreen exists)

---

## Story

As a **customer whose service is actively in progress and who feels unsafe**,
I want a discreet one-tap SOS button on my active tracking screen that silently alerts the owner,
so that **I can get help without the technician knowing I've triggered an alert**.

---

## Acceptance Criteria

### AC-1 · SOS button is visible only during active service
- **Given** the customer is on the `LiveTrackingScreen`
- **When** `BookingStatus` is `InProgress`
- **Then** a small discreet SOS icon button is visible (no explicit "SOS" label — icon only, accessible via content description)
- **And** the button is NOT visible in any other status (EnRoute, Reached, Completed, Unknown)

### AC-2 · 30-second cancel countdown bottom sheet
- **When** the customer taps the SOS icon
- **Then** a bottom sheet appears showing: `"सुरक्षा अलर्ट 30 सेकंड में भेजा जाएगा — रद्द करें"`
- **And** a countdown timer counts down from 30 seconds
- **And** a prominent cancel button is visible
- **When** the customer taps cancel before 30 seconds
- **Then** the bottom sheet dismisses with no API call made

### AC-3 · First-time audio consent dialog
- **When** the customer taps the SOS icon for the first time (no stored consent preference in DataStore)
- **Then** a consent dialog is shown first: `"क्या आप audio record करना चाहते हैं? यह सिर्फ आपके device पर save होगा।"`
- **And** the customer can choose Yes or No
- **And** the preference is stored in DataStore (one-time only — not shown again)
- **When** consent is granted → `MediaRecorder` starts during the 30-second window, stores an encrypted local file only (never uploaded)
- **When** consent is denied or already given → the countdown proceeds without recording

### AC-4 · POST /v1/sos/{bookingId} — success path
- **Given** booking `status == 'IN_PROGRESS'` and the caller is `booking.customerId`
- **When** the countdown completes (or the customer taps "Confirm now")
- **Then** `POST /v1/sos/{bookingId}` is called
- **And** the API returns `201 Created`
- **And** a snackbar shows: `"मालिक को सूचित किया गया"`
- **And** the bottom sheet closes

### AC-5 · Owner FCM notification sent
- **When** the SOS fires
- **Then** an FCM data message is sent to topic `owner_alerts`:
  ```json
  {
    "type": "SOS_ALERT",
    "bookingId": "<bookingId>",
    "customerId": "<customerId>",
    "technicianId": "<technicianId>",
    "customerName": "<customerName>",
    "slotAddress": "<addressText>"
  }
  ```
- FCM failure is caught, captured by Sentry — must NOT block the 201 response

### AC-6 · Audit log entry appended
- **When** the SOS is processed
- **Then** `appendAuditEntry` is called with:
  ```
  { adminId: customerId, role: 'system', action: 'SOS_TRIGGERED',
    resourceType: 'booking', resourceId: bookingId,
    payload: { technicianId, slotAddress }, timestamp }
  ```
- Audit log failure does NOT block the 201 response (fire-and-forget)

### AC-7 · Idempotency — one active SOS per booking
- **Given** a SOS has already been triggered for a booking (`booking.sosActivatedAt` field is set)
- **When** `POST /v1/sos/{bookingId}` is called again
- **Then** the API returns `200 OK` (already processed — no duplicate FCM or audit entry)

### AC-8 · Guard rails
- **When** the booking is not `IN_PROGRESS` → `409 BOOKING_NOT_IN_PROGRESS`
- **When** the caller is not `booking.customerId` → `403 FORBIDDEN`
- **When** the booking is not found → `404 BOOKING_NOT_FOUND`
- **When** no Bearer token → `401 UNAUTHENTICATED` (middleware)

---

## Tasks / Subtasks

> TDD: test file committed before implementation file per CLAUDE.md.

### WS-A — Schema extension (api/)

- [ ] **T1 — Booking schema**
  - [ ] Add `sosActivatedAt: z.string().optional()` to `BookingDocSchema` in `api/src/schemas/booking.ts`

- [ ] **T2 — Booking repo method**
  - [ ] Add `markSosActivated(id: string): Promise<BookingDoc | null>` to `api/src/cosmos/booking-repository.ts`
    - Read existing booking, patch `{ sosActivatedAt: new Date().toISOString() }`, replace doc, return updated
    - Returns `null` if booking not found

### WS-B — SOS API function (api/, TDD)

- [ ] **T3 — Test file first**
  - [ ] Create `api/tests/unit/sos.test.ts` — write all tests before implementation:
    - `401` — missing Bearer token (middleware)
    - `404` — booking not found
    - `403` — caller !== booking.customerId
    - `409 BOOKING_NOT_IN_PROGRESS` — status is not `IN_PROGRESS`
    - `200` — idempotent (sosActivatedAt already set)
    - `201` — success: FCM sent (fire-and-forget, non-blocking), audit entry called, `markSosActivated` called

- [ ] **T4 — SOS function**
  - [ ] Create `api/src/functions/sos.ts`:
    ```
    POST v1/sos/{bookingId}  — requireCustomer middleware
    1. bookingRepo.getById(bookingId)           → 404 if null
    2. booking.customerId !== customer.customerId → 403
    3. booking.status !== 'IN_PROGRESS'          → 409 BOOKING_NOT_IN_PROGRESS
    4. if booking.sosActivatedAt                 → 200 (already processed)
    5. bookingRepo.markSosActivated(bookingId)
    6. sendOwnerSosAlert(payload)                → fire-and-forget (ctx.error on failure)
    7. appendAuditEntry(sosEntry)                → fire-and-forget (ctx.error on failure)
    8. return 201
    ```
  - [ ] Add `sendOwnerSosAlert` to `api/src/services/fcm.service.ts`:
    ```ts
    export async function sendOwnerSosAlert(payload: {
      bookingId: string; customerId: string; technicianId: string;
      customerName: string; slotAddress: string;
    }): Promise<void>
    ```
    Topic: `'owner_alerts'`, data type: `'SOS_ALERT'`

### WS-C — Domain + data layer (customer-app/, TDD)

- [ ] **T5 — Test file first**
  - [ ] Create `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/sos/SosUseCaseTest.kt`
    - Tests: successful call → `Result.success(Unit)`, network error → `Result.failure(...)`
    - Use manual MockK construction (no Hilt per `docs/patterns/hilt-module-android-test-scope.md`)

- [ ] **T6 — Remote API service**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/remote/SosApiService.kt`
    ```kotlin
    public interface SosApiService {
        @POST("v1/sos/{bookingId}")
        public suspend fun triggerSos(@Path("bookingId") bookingId: String): Response<Unit>
    }
    ```

- [ ] **T7 — SOS use case**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/sos/SosUseCase.kt`
    ```kotlin
    public class SosUseCase @Inject constructor(
        private val apiService: SosApiService,
    ) {
        public suspend fun execute(bookingId: String): Result<Unit>
    }
    ```
    Returns `Result.success(Unit)` on 201 or 200, `Result.failure` on network/other errors.

- [ ] **T8 — Consent DataStore**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/SosConsentStore.kt`
    - Uses `DataStore<Preferences>` (already in project from auth stories)
    - `suspend fun getAudioConsent(): Boolean?` — returns null if not yet answered
    - `suspend fun setAudioConsent(granted: Boolean)`

- [ ] **T9 — Hilt DI module**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/di/SosModule.kt`
    - `@Provides SosApiService` — Retrofit instance from existing `@Named("authenticatedRetrofit")`
    - `@Binds` if interface-backed; `@Provides` with direct constructor if concrete
    - Follow `docs/patterns/hilt-module-android-test-scope.md` — no `@UninstallModules` in JVM tests

### WS-D — ViewModel + UI (customer-app/, TDD)

- [ ] **T10 — SosViewModel test first**
  - [ ] Create `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/SosViewModelTest.kt`
    - Tests: initial state is `Idle`, tap → `ShowConsent` when no consent stored, countdown starts after consent resolved, cancel → back to `Idle`, confirm → calls SosUseCase → `SosConfirmed`

- [ ] **T11 — SosViewModel**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosViewModel.kt`
    ```kotlin
    @HiltViewModel
    public class SosViewModel @Inject constructor(
        savedStateHandle: SavedStateHandle,
        private val sosUseCase: SosUseCase,
        private val consentStore: SosConsentStore,
    ) : ViewModel()
    ```
    - `bookingId` read from `savedStateHandle["bookingId"]`
    - `uiState: StateFlow<SosUiState>` — sealed: `Idle | ShowConsent | Countdown(secondsLeft: Int) | SosConfirmed | SosError`
    - `onSosTapped()` — check consent, emit `ShowConsent` or start countdown
    - `onConsentResolved(granted: Boolean)` — store preference, start countdown
    - `onCancelCountdown()` — reset to `Idle`
    - `onCountdownComplete()` — call `sosUseCase.execute(bookingId)` → emit `SosConfirmed` or `SosError`
    - Countdown via `viewModelScope` coroutine, 1-second ticks

- [ ] **T12 — SOS UI composables**
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosBottomSheet.kt`
    - `@Composable internal fun SosBottomSheet(secondsLeft: Int, onCancel: () -> Unit, onConfirmNow: () -> Unit)`
    - Shows Hindi countdown text + cancel button + optional "send now" button
    - No navigation route — shown as overlay on `LiveTrackingScreen`
  - [ ] Create `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosConsentDialog.kt`
    - `@Composable internal fun SosConsentDialog(onGranted: () -> Unit, onDenied: () -> Unit)`
    - Hindi text: `"क्या आप audio record करना चाहते हैं? यह सिर्फ आपके device पर save होगा।"`

- [ ] **T13 — Modify LiveTrackingScreen**
  - [ ] In `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt`:
    - Add `sosViewModel: SosViewModel = hiltViewModel()` parameter
    - Add SOS icon button to `TopAppBar` actions — visible only when `state is LiveTrackingUiState.Tracking && state.status == BookingStatus.InProgress`
    - Use `Icons.Outlined.Shield` (or `Icons.Filled.Shield`) with `contentDescription = "Safety alert"`
    - Show `SosBottomSheet` as `ModalBottomSheet` when `sosUiState is SosUiState.Countdown`
    - Show `SosConsentDialog` as `AlertDialog` when `sosUiState is SosUiState.ShowConsent`
    - Show `Snackbar` when `sosUiState is SosUiState.SosConfirmed` with text `"मालिक को सूचित किया गया"`

- [ ] **T14 — Paparazzi stub (CI goldens only)**
  - [ ] Create `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/SosScreenTest.kt`
    - Add `@Test @Ignored fun sosBottomSheetGolden()` and `@Test @Ignored fun sosConsentDialogGolden()`
    - Per `docs/patterns/paparazzi-cross-os-goldens.md`: do NOT run `recordPaparazziDebug` on Windows
    - Remove any auto-generated goldens before push: `git rm -r customer-app/src/test/snapshots/images/ 2>/dev/null || true`

- [ ] **T15 — Audio recording (optional, privacy-gated)**
  - [ ] `SosViewModel` — when consent is `true` and countdown starts, launch `MediaRecorder` in a `viewModelScope` side-effect
  - [ ] Store encrypted `.m4a` in `context.filesDir/sos/` (app-private, never uploaded)
  - [ ] Stop recording on countdown complete or cancel
  - [ ] Declare `RECORD_AUDIO` permission in `AndroidManifest.xml` with `uses-permission` (runtime request before starting recorder)

### WS-E — Smoke gate

- [ ] **T16 — Pre-Codex smoke gates**
  ```bash
  bash tools/pre-codex-smoke-api.sh
  bash tools/pre-codex-smoke.sh customer-app
  ```
  Both must exit 0 before review.

---

## Developer Context & Guardrails

### Critical codebase facts

**FCM owner topic:** The existing `fcm.service.ts` uses topic `'owner_alerts'` (not `'owner_ops'`). All owner FCM messages go to this topic. Add `sendOwnerSosAlert` as a new exported function following the exact same pattern as `sendOwnerRatingShieldAlert`.

**Audit log schema constraint:** `AuditLogEntry.role` must be one of `['super-admin', 'ops-manager', 'finance', 'support-agent', 'system']`. For customer-triggered SOS, use `role: 'system'`. The `adminId` field accepts any string — use the `customerId`. The `partitionKey` for `AuditLogDoc` is `'yyyy-mm'` format (e.g. `new Date().toISOString().slice(0, 7)`).

**Booking schema idempotency:** Add `sosActivatedAt?: z.string().optional()` to `BookingDocSchema`. This is the idempotency key — if present, return 200 immediately without re-sending FCM or re-appending audit. Do NOT add a new Cosmos container for SOS.

**SOS API endpoint pattern:** Mirror `api/src/functions/rating-escalate.ts` exactly — `app.http(...)` registration at bottom, `requireCustomer` wrapping, fire-and-forget FCM via `.catch(err => ctx.error(...))`.

**LiveTrackingScreen modification:** Only add to the existing `TopAppBar` `actions` parameter — do not restructure the Scaffold or Column layout. The SOS icon must be inside the `actions` lambda of `TopAppBar`. Pass `sosViewModel` as a second `hiltViewModel()` parameter — the screen already uses `hiltViewModel()` for `LiveTrackingViewModel`.

**BookingStatus.InProgress:** In `customer-app`, the status is `BookingStatus.InProgress` (sealed class object). The SOS button visibility check: `(uiState is LiveTrackingUiState.Tracking && (uiState as LiveTrackingUiState.Tracking).status is BookingStatus.InProgress)`.

**Explicit API mode (mandatory):** Every new Kotlin declaration that is `public` (including test classes and `@Test` methods) MUST have the `public` modifier explicitly written. See `docs/patterns/kotlin-explicit-api-public-modifier.md`. The compiler will error without it under `-Xexplicit-api=strict`.

**Hilt test scope:** JVM unit tests (SosUseCaseTest, SosViewModelTest) MUST use manual MockK construction — no `@HiltAndroidTest`, no `HiltAndroidRule`. See `docs/patterns/hilt-module-android-test-scope.md`.

**DataStore for consent:** The project already uses `DataStore<Preferences>` (from E02-S01 auth stories). Do NOT introduce a new DataStore instance — inject the existing `dataStore` from the application context via Hilt. The key is `booleanPreferencesKey("sos_audio_consent_given")`.

**No technician-app changes:** Technician must not see the SOS trigger or receive any FCM related to it. The `owner_alerts` topic is owner-only.

**Audio recording scope:** `MediaRecorder` is started when countdown begins (after consent=true). It is stopped and the file finalized on countdown complete OR cancel. Use `AudioSource.MIC`, `OutputFormat.MPEG_4`, `AudioEncoder.AAC`. The file name should include `bookingId` for traceability. This is entirely local — no upload path.

### Files to CREATE

**api/**
- `api/src/functions/sos.ts`
- `api/tests/unit/sos.test.ts`

**api/ (MODIFY)**
- `api/src/schemas/booking.ts` — add `sosActivatedAt` field
- `api/src/cosmos/booking-repository.ts` — add `markSosActivated`
- `api/src/services/fcm.service.ts` — add `sendOwnerSosAlert`

**customer-app/**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/remote/SosApiService.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/SosConsentStore.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/data/sos/di/SosModule.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/sos/SosUseCase.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosViewModel.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosBottomSheet.kt`
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/SosConsentDialog.kt`
- `customer-app/app/src/test/kotlin/com/homeservices/customer/domain/sos/SosUseCaseTest.kt`
- `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/SosViewModelTest.kt`
- `customer-app/app/src/test/kotlin/com/homeservices/customer/ui/tracking/SosScreenTest.kt` (Paparazzi `@Ignored` stubs)

**customer-app/ (MODIFY)**
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt` — add SOS icon + overlay composables
- `customer-app/app/src/main/AndroidManifest.xml` — add `RECORD_AUDIO` permission

### Files to NOT touch
- `technician-app/` — any file
- `api/src/functions/trigger-no-show-detector.ts` — E07-S04 is complete
- `api/src/functions/ratings.ts`, `complaints.ts` — E07-S01 through S03 are complete
- `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingViewModel.kt` — no changes needed

### Test patterns (from this codebase)

**API test (Vitest):**
```ts
// api/tests/unit/sos.test.ts
vi.mock('../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn(), markSosActivated: vi.fn() },
}));
vi.mock('../../src/services/fcm.service.js');
vi.mock('../../src/services/firebaseAdmin.js', ...);  // for requireCustomer mock
```
Pattern from `trigger-no-show-detector.test.ts` and `customer-credit-repository.test.ts`.

**Android test (JUnit 5 + MockK):**
```kotlin
public class SosUseCaseTest {
    private val apiService: SosApiService = mockk()
    private val useCase = SosUseCase(apiService)

    @Test
    public fun `execute returns success on 201`() { ... }
}
```

### Smoke gate commands
```bash
# API smoke gate
bash tools/pre-codex-smoke-api.sh

# Android smoke gate
bash tools/pre-codex-smoke.sh customer-app
```

### Review gate (no Codex available this session)
```
/superpowers:code-reviewer   ← substitute review
Open PR — do NOT merge until Codex review on 2026-04-28
```

---

## Dev Notes (pre-implementation)

**SOS UI placement decision:** The SOS icon belongs in `TopAppBar`'s `actions` parameter (top-right), not as a floating button or bottom bar item. Rationale: (1) discreet placement away from regular flow, (2) doesn't compete with the status timeline or map area, (3) easily missed by an onlooker — which is exactly the intent for safety scenarios.

**Why `owner_alerts` not `owner_ops`:** The FCM service currently has no `owner_ops` topic. All owner alerts (rating shield, recon mismatch, and now SOS) flow through `'owner_alerts'`. If the intent was to separate operational vs. safety alerts in future, that would need a new topic registered in Firebase and a separate admin FCM subscription — out of scope for this story.

**Why `role: 'system'`:** The audit log schema restricts `role` to admin-tier values. SOS is customer-triggered, not admin-triggered. Using `'system'` correctly signals automated/platform action and keeps the audit trail meaningful for owner review without expanding the enum.

**Idempotency via `sosActivatedAt`:** Stored on the booking doc itself (not a separate container) to avoid a cross-container read-your-writes race. A second SOS tap within the same booking session returns 200 silently — the owner has already been alerted.

---

*Story E07-S05 created 2026-04-26. Analysis completed — ready for feature-tier execution.*

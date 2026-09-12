# E24-S01c — Customer masked-VPA display — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the customer the technician's masked UPI ID on their own tracking screen once a job is complete — a swap-detection mitigation for E24-S01's UPI QR feature (a technician could otherwise show a personal QR instead of their registered one; the customer seeing the registered handle in the app makes a mismatch visible).

**Architecture:** One field threaded from an existing API response through the existing repository/use-case/ViewModel chain to one new conditional card on `LiveTrackingScreen`. No new endpoints, no new screens.

**Tech Stack:** Retrofit/Moshi + Jetpack Compose + Hilt (customer-app).

**Spec:** Owner-approved design: `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` § "E24-S01 · Technician UPI QR" (the "residual risk" mitigation paragraph). Split out of the combined E24-S01 Android plan (root CLAUDE.md story-size gate) as the one piece with zero dependency on the technician-app work in `plans/E24-S01b-android-upi-qr.md` or on `E21-S05`.

**Depends on:** `E24-S01a` (`plans/E24-S01a-payment-profile-api.md`) — needs `technicianUpiMasked` live on `GET /v1/bookings/{id}` before this is exercisable end-to-end (unit tests here mock the API layer, so they don't require it to be deployed first).

## Global Constraints

- All new user-facing strings need both `values/strings.xml` and `values-hi/strings.xml` entries (product is Hindi-default).
- Never phrase the card as "payment verified" — there is no PSP webhook backing the technician's declared VPA. Label it plainly as technician-declared.
- Read `docs/patterns/kotlin-explicit-api-public-modifier.md` before adding new public Kotlin files (customer-app uses Kotlin explicit API mode).
- Paparazzi goldens are recorded on CI Linux only (`docs/patterns/paparazzi-cross-os-goldens.md`) — never run `recordPaparazzi` locally on Windows; delete any locally-generated golden PNGs before committing and trigger `paparazzi-record.yml` via `workflow_dispatch` once the PR is up.

---

## Work Stream A — thread `technicianUpiMasked` to `LiveTrackingScreen`

### Task 1: Thread `technicianUpiMasked` from API response to `LiveTrackingScreen`

**Files:**
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt` (`GetBookingResponseDto`)
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/tracking/model/TrackingState.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImpl.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/domain/tracking/TrackBookingStatusUseCase.kt` (or add a sibling use case — see Step 3)
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingUiState.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingViewModel.kt`
- Modify: `customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking/LiveTrackingScreen.kt`
- Test: `customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt` (create if none exists; check first)
- Modify: `values/strings.xml` and `values-hi/strings.xml`

**Interfaces:**
- Produces: `TrackingState.technicianUpiMasked: String?`; `LiveTrackingUiState.Tracking.technicianUpiMasked: String?`.

`TrackBookingStatusUseCase.execute()` currently maps `TrackingState` down to just `BookingStatus` (`repository.trackBooking(bookingId).map { it.status }`) — narrower than what `LiveTrackingViewModel` needs here. Rather than widen that use case's return type (which would ripple to every other caller), add the masked VPA via a second, single-purpose use case that mirrors its shape:

```kotlin
package com.homeservices.customer.domain.tracking

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

public class TrackTechnicianUpiUseCase
    @Inject
    constructor(
        private val repository: TrackingRepository,
    ) {
        public fun execute(bookingId: String): Flow<String?> =
            repository.trackBooking(bookingId).map { it.technicianUpiMasked }
    }
```

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `trackBooking's initial state carries technicianUpiMasked from the booking response`() = runTest {
    val bookingApi = mockk<BookingApiService>()
    coEvery { bookingApi.getBooking("b1") } returns GetBookingResponseDto(
        bookingId = "b1",
        status = "COMPLETED",
        amount = 65000,
        finalAmount = 65000,
        pendingAddOns = emptyList(),
        technicianUpiMasked = "al••••••@okhdfcbank",
    )
    val repo = TrackingRepositoryImpl(eventBus = fakeEventBus(), bookingApi = bookingApi)

    val state = repo.trackBooking("b1").first()

    assertThat(state.technicianUpiMasked).isEqualTo("al••••••@okhdfcbank")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*TrackingRepositoryImplTest*"`
Expected: FAIL — `technicianUpiMasked` unknown on `GetBookingResponseDto`/`TrackingState`.

- [ ] **Step 3: Write minimal implementation**

`GetBookingResponseDto` gains one field:

```kotlin
@JsonClass(generateAdapter = true)
public data class GetBookingResponseDto(
    val bookingId: String,
    val status: String,
    val amount: Int,
    val finalAmount: Int?,
    val pendingAddOns: List<PendingAddOnDto>,
    val technicianUpiMasked: String? = null,
)
```

`TrackingState.kt`:

```kotlin
public data class TrackingState(
    val location: LiveLocation?,
    val status: BookingStatus,
    val technicianUpiMasked: String? = null,
)
```

`TrackingRepositoryImpl.kt` — carry it from the initial fetch through the `scan` (location/status updates never change it, so `state.copy(technicianUpiMasked = ...)` is unnecessary in the `scan` branches — it's set once on `initialState` and preserved by `.copy()` in both existing branches automatically since neither branch touches that field):

```kotlin
        public override fun trackBooking(bookingId: String): Flow<TrackingState> =
            flow {
                val initialBooking = runCatching { bookingApi.getBooking(bookingId) }.getOrNull()
                val initialStatus =
                    initialBooking?.status?.let { BookingStatus.fromFcmString(it) } ?: BookingStatus.Unknown
                val initialState = TrackingState(
                    location = null,
                    status = initialStatus,
                    technicianUpiMasked = initialBooking?.technicianUpiMasked,
                )
                // ...unchanged emitAll(...) below...
```

Add `TrackTechnicianUpiUseCase` as shown above.

`LiveTrackingUiState.kt` gains one field on `Tracking`:

```kotlin
    public data class Tracking(
        val bookingId: String,
        val location: LiveLocation?,
        val status: BookingStatus,
        val techName: String,
        val techPhotoUrl: String,
        val etaMinutes: Int?,
        val technicianId: String? = null,
        val liveLat: Double? = null,
        val liveLng: Double? = null,
        val liveCapturedAt: Long? = null,
        val technicianUpiMasked: String? = null,
    ) : LiveTrackingUiState()
```

`LiveTrackingViewModel.kt` — inject `TrackTechnicianUpiUseCase` and fold it into the existing `combine`:

```kotlin
        constructor(
            savedStateHandle: SavedStateHandle,
            private val getLiveLocationUseCase: GetLiveLocationUseCase,
            private val trackBookingStatusUseCase: TrackBookingStatusUseCase,
            private val trackTechnicianUpiUseCase: TrackTechnicianUpiUseCase,
            private val locationUpdateEventBus: LocationUpdateEventBus,
        ) : ViewModel() {
            // ...
            public val uiState: StateFlow<LiveTrackingUiState> =
                combine(
                    getLiveLocationUseCase.execute(bookingId),
                    trackBookingStatusUseCase.execute(bookingId),
                    trackTechnicianUpiUseCase.execute(bookingId),
                    liveLocationFromBus,
                ) { location, status, technicianUpiMasked, busEvent ->
                    LiveTrackingUiState.Tracking(
                        bookingId = bookingId,
                        location = location,
                        status = status,
                        techName = location?.techName ?: "",
                        techPhotoUrl = location?.techPhotoUrl ?: "",
                        etaMinutes = location?.etaMinutes,
                        technicianId = location?.technicianId,
                        liveLat = busEvent?.lat ?: location?.lat,
                        liveLng = busEvent?.lng ?: location?.lng,
                        liveCapturedAt = busEvent?.capturedAt,
                        technicianUpiMasked = technicianUpiMasked,
                    )
                }.stateIn(...)
```

(`combine` with 4 flows needs the 4-arg overload — Kotlin's stdlib `combine` supports up to 5 flows directly, so no restructuring needed.)

`LiveTrackingScreen.kt` — add one small conditional card near where the status stepper renders `BookingStatus.Completed`, following the existing `TrustDossierCard` pattern in the same file:

```kotlin
if (uiState.status == BookingStatus.Completed && uiState.technicianUpiMasked != null) {
    PaymentDeclarationCard(technicianUpiMasked = uiState.technicianUpiMasked)
}
```

```kotlin
@Composable
private fun PaymentDeclarationCard(technicianUpiMasked: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier.fillMaxWidth().padding(16.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.tracking_payment_declaration_label),
                fontWeight = FontWeight.Bold,
            )
            Text(text = technicianUpiMasked)
            Text(
                text = stringResource(R.string.tracking_payment_declaration_disclaimer),
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
```

Add strings (`values/strings.xml`):

```xml
<string name="tracking_payment_declaration_label">Technician\'s registered UPI ID</string>
<string name="tracking_payment_declaration_disclaimer">Technician-declared — not verified by a payment provider. Confirm it matches before paying.</string>
```

`values-hi/strings.xml`:

```xml
<string name="tracking_payment_declaration_label">तकनीशियन की पंजीकृत यूपीआई आईडी</string>
<string name="tracking_payment_declaration_disclaimer">तकनीशियन द्वारा बताई गई — भुगतान प्रदाता द्वारा सत्यापित नहीं। भुगतान करने से पहले मिलान कर लें।</string>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd customer-app && ./gradlew testDebugUnitTest --tests "*TrackingRepositoryImplTest*"`, then the full `./gradlew testDebugUnitTest` to catch any other `GetBookingResponseDto(...)`/`TrackingState(...)` construction site broken by the new field (all new fields are defaulted/nullable, so existing call sites should still compile unchanged).

- [ ] **Step 5: Add a Paparazzi golden for the new card state** (mirrors the `@Ignore`, CI-recorded pattern used elsewhere in this repo — e.g. `technician-app`'s `CompletionConfirmationDialogPaparazziTest.kt` — added to whichever existing `LiveTrackingScreen` Paparazzi test file exists, or a new one in the same shell if none exists yet)

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/domain/tracking \
        customer-app/app/src/main/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImpl.kt \
        customer-app/app/src/main/kotlin/com/homeservices/customer/ui/tracking \
        customer-app/app/src/test/kotlin/com/homeservices/customer/data/tracking/TrackingRepositoryImplTest.kt \
        customer-app/app/src/main/res/values/strings.xml customer-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(customer-app): show technician's masked UPI ID on the completed tracking screen"
```

---

## Work Stream B — smoke gate + review

### Task 2: Smoke gate + Codex + push

- [ ] Run `bash tools/pre-codex-smoke.sh customer-app` — must exit 0. Delete any locally-generated Paparazzi golden PNGs first and use `-PexcludePaparazzi` per `feedback_smoke_gate_paparazzi` if Paparazzi itself misbehaves on Windows.
- [ ] Invoke the `codex-review-gate` skill (`codex review --base main`). Fix any findings and re-run once per `feedback_codex_paired_pr_pattern`/`feedback_lean_review_stack` — do not iterate more than once without checking in.
- [ ] After Codex passes, trigger `paparazzi-record.yml` via `workflow_dispatch` for `customer-app` to record the new golden on CI Linux.
- [ ] `git fetch origin main && git merge origin/main` before the final push.
- [ ] Push and open the PR with `gh pr merge --auto --squash` once CI is green.

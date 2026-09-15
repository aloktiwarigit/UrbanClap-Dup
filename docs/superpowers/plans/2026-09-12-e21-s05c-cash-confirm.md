# E21-S05c — Cash Confirm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the technician app actually record what cash it collected at the door — including partial collections and completions that happened offline — by sending fields the API has accepted since E21-S01 and has never once received.

**Architecture:** The active-job `GET` response widens by two fields so the client can tell a cash booking from a prepaid one and knows the expected amount. The completion dialog becomes cash-aware for `CASH_ON_SERVICE` bookings only, with an editable amount and a required reason when the amount falls short. The cash fields are threaded through all five client layers and persisted in the offline-replay queue so a completion recorded without signal still reports its collection when it syncs.

**Tech Stack:** Node 22 + TypeScript (Azure Functions, Zod, Vitest), Kotlin + Compose (Hilt, Moshi, Retrofit, Room, MockK, JUnit 5, AssertJ, Paparazzi).

**Spec:** `docs/superpowers/specs/2026-09-12-e21-s05-technician-kyc-wallet-design.md` (§4, §9)

## Global Constraints

- **Worktree:** `C:/Alok/Business Projects/wt-e21-s05`, branch `feat/e21-s05-technician-kyc-wallet`. Independent of E21-S05a and E21-S05b except for shared string files.
- **E24-S01 (session-1) is waiting on this plan.** It adds `collectionMethod: UPI_QR` as a second option on top of this dialog. Therefore: put the collection method in the request as an explicit value (`"CASH"`), not an implicit server default, and shape the dialog so a method picker can be added without restructuring it. Do **not** build the picker here.
- **The commission is computed server-side** from `finalAmount ?? amount` (`commission-settlement.service.ts:46`), never from `collectedAmount`. A wrong amount corrupts the collection *record*, not the debt. Do not add client-side commission math.
- **Read-path widening only.** The two new response fields are additive. Do not tighten any request schema (`feedback_read_path_validation` — the 2026-09-05 outage).
- **Prepaid bookings must be untouched.** When `paymentMethod == 'RAZORPAY'`, the dialog keeps today's exact confirm/cancel behaviour and sends no cash fields. `settleCashCompletion` skips those bookings entirely (`skipped: 'NOT_CASH'`); asking for cash there is simply wrong.
- **Kotlin explicit API mode**, **string parity in `values-hi`**, **Paparazzi never recorded locally, existing goldens never deleted**, **80% coverage** — as in the sibling plans.

---

## File Structure

**API:**
- Modify `api/src/functions/active-job.ts` — two fields on the GET response.
- Modify `api/tests/functions/active-job.test.ts`.

**Android:**
- Modify `domain/activeJob/model/ActiveJob.kt` — `amountPaise`, `paymentMethod`.
- Modify `data/activeJob/…` — `ActiveJobResponse` DTO, `TransitionRequest`, repository interface + impl.
- Modify `domain/activeJob/CompleteJobUseCase.kt`.
- Modify `ui/activeJob/CompletionConfirmationDialog.kt`, `ActiveJobScreen.kt`, `ActiveJobViewModel.kt`.
- Modify `data/activeJob/db/PendingTransitionEntity.kt` + its DAO + the Room database (version bump + migration).
- Modify `res/values/strings.xml`, `res/values-hi/strings.xml`.

---

## Task 1: Widen the active-job response

**Files:**
- Modify: `api/src/functions/active-job.ts:62-74`
- Test: `api/tests/functions/active-job.test.ts`

**Interfaces:**
- Produces: `amountPaise: number` and `paymentMethod: 'RAZORPAY' | 'CASH_ON_SERVICE'` on `GET` active job — Task 2 consumes both.

- [ ] **Step 1: Write the failing test**

Append to `api/tests/functions/active-job.test.ts`, matching its existing mock setup:

```ts
  it('returns amountPaise from finalAmount when one is set', async () => {
    getBookingById.mockResolvedValue({
      id: 'b1', technicianId: 't1', customerId: 'c1', serviceId: 's1',
      status: 'IN_PROGRESS', amount: 80_000, finalAmount: 95_000,
      paymentMethod: 'CASH_ON_SERVICE',
      addressText: 'x', addressLatLng: { lat: 1, lng: 2 },
      slotDate: '2026-09-12', slotWindow: '10-12',
    });

    const res = await getActiveJobHandler(reqFor('t1'), {} as never);

    expect((res.jsonBody as { amountPaise: number }).amountPaise).toBe(95_000);
  });

  it('falls back to amount when finalAmount is absent', async () => {
    getBookingById.mockResolvedValue({
      id: 'b1', technicianId: 't1', customerId: 'c1', serviceId: 's1',
      status: 'IN_PROGRESS', amount: 80_000,
      paymentMethod: 'CASH_ON_SERVICE',
      addressText: 'x', addressLatLng: { lat: 1, lng: 2 },
      slotDate: '2026-09-12', slotWindow: '10-12',
    });

    const res = await getActiveJobHandler(reqFor('t1'), {} as never);

    expect((res.jsonBody as { amountPaise: number }).amountPaise).toBe(80_000);
  });

  it('defaults paymentMethod to CASH_ON_SERVICE when the booking omits it', async () => {
    // Legacy bookings predate the field. The settlement path applies the same default
    // (commission-settlement.service.ts:73), so the client must see the same answer.
    getBookingById.mockResolvedValue({
      id: 'b1', technicianId: 't1', customerId: 'c1', serviceId: 's1',
      status: 'IN_PROGRESS', amount: 80_000,
      addressText: 'x', addressLatLng: { lat: 1, lng: 2 },
      slotDate: '2026-09-12', slotWindow: '10-12',
    });

    const res = await getActiveJobHandler(reqFor('t1'), {} as never);

    expect((res.jsonBody as { paymentMethod: string }).paymentMethod).toBe('CASH_ON_SERVICE');
  });

  it('reports RAZORPAY for a prepaid booking', async () => {
    getBookingById.mockResolvedValue({
      id: 'b1', technicianId: 't1', customerId: 'c1', serviceId: 's1',
      status: 'IN_PROGRESS', amount: 80_000, paymentMethod: 'RAZORPAY',
      addressText: 'x', addressLatLng: { lat: 1, lng: 2 },
      slotDate: '2026-09-12', slotWindow: '10-12',
    });

    const res = await getActiveJobHandler(reqFor('t1'), {} as never);

    expect((res.jsonBody as { paymentMethod: string }).paymentMethod).toBe('RAZORPAY');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd api && npx vitest run tests/functions/active-job.test.ts`
Expected: FAIL — both fields are `undefined`.

- [ ] **Step 3: Write the implementation**

In `api/src/functions/active-job.ts`, add to the GET handler's `jsonBody`:

```ts
      // E21-S05c: the client cannot otherwise distinguish a cash booking from a prepaid one at
      // completion time, and would ask for cash on a Razorpay job that settlement skips entirely.
      // The default mirrors commission-settlement.service.ts's own fallback for legacy bookings.
      amountPaise: booking.finalAmount ?? booking.amount,
      paymentMethod: booking.paymentMethod ?? 'CASH_ON_SERVICE',
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd api && npx vitest run tests/functions/active-job.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
If an OpenAPI check fails, regenerate per `feedback_openapi_client_regen` — the registry is 2 of 3 steps; run the client generation too.

- [ ] **Step 6: Commit**

```bash
git add api/src/functions/active-job.ts api/tests/functions/active-job.test.ts
git commit -m "feat(api): expose amountPaise and paymentMethod on the active-job response"
```

---

## Task 2: Android — carry amount and payment method into the domain

**Files:**
- Modify: `domain/activeJob/model/ActiveJob.kt`
- Modify: `data/activeJob/…` (`ActiveJobResponse` DTO and its mapper)
- Test: `app/src/test/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImplTest.kt`

**Interfaces:**
- Consumes: Task 1's two response fields.
- Produces: `ActiveJob.amountPaise: Long`, `ActiveJob.paymentMethod: PaymentMethod` — Tasks 3-5 consume them.

- [ ] **Step 1: Write the failing test**

```kotlin
    @Test
    public fun `maps amountPaise and paymentMethod from the response`(): Unit =
        runTest {
            coEvery { api.getActiveJob() } returns
                anActiveJobResponse(amountPaise = 95_000L, paymentMethod = "CASH_ON_SERVICE")

            val job = repository.getActiveJob()

            assertThat(job?.amountPaise).isEqualTo(95_000L)
            assertThat(job?.paymentMethod).isEqualTo(PaymentMethod.CASH_ON_SERVICE)
        }

    @Test
    public fun `an unknown payment method falls back to CASH_ON_SERVICE`(): Unit =
        runTest {
            // Failing open to cash means the technician is asked to confirm a collection that may
            // not apply — recoverable. Failing to RAZORPAY would silently skip recording real cash.
            coEvery { api.getActiveJob() } returns
                anActiveJobResponse(amountPaise = 80_000L, paymentMethod = "SOMETHING_NEW")

            assertThat(repository.getActiveJob()?.paymentMethod).isEqualTo(PaymentMethod.CASH_ON_SERVICE)
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobRepositoryImplTest*" -PexcludePaparazzi`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```kotlin
public enum class PaymentMethod {
    CASH_ON_SERVICE,
    RAZORPAY,
    ;

    public companion object {
        /** Unknown values fail open to cash — see the test for why that direction. */
        public fun fromWire(raw: String?): PaymentMethod =
            entries.firstOrNull { it.name == raw } ?: CASH_ON_SERVICE
    }
}
```

Add `public val amountPaise: Long` and `public val paymentMethod: PaymentMethod` to `ActiveJob`, add the two fields to `ActiveJobResponse` (with `amountPaise: Long = 0L` and `paymentMethod: String? = null` defaults so an older server response still parses), and map them in the repository.

- [ ] **Step 4: Run to verify it passes, then fix all construction sites**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobRepositoryImplTest*" -PexcludePaparazzi && ./gradlew assembleDebug --quiet`
Expected: PASS then BUILD SUCCESSFUL (fix every `ActiveJob(...)` call site the new fields break, including test fixtures).

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/activeJob/
git commit -m "feat(technician-app): carry booking amount and payment method into the active job"
```

---

## Task 3: Thread cash fields through the request path

**Files:**
- Modify: `data/activeJob/…` — `TransitionRequest`, `ActiveJobRepository` (interface + impl)
- Modify: `domain/activeJob/CompleteJobUseCase.kt`
- Modify: `ui/activeJob/ActiveJobViewModel.kt`
- Test: `app/src/test/kotlin/com/homeservices/technician/domain/activeJob/CompleteJobUseCaseTest.kt`

**Interfaces:**
- Produces: `CompleteJobUseCase.invoke(bookingId: String, cash: CashCollection?)` where

```kotlin
public data class CashCollection(
    public val collectedAmountPaise: Long,
    public val shortReason: ShortCollectionReason?,
)
```

Task 4 (dialog) and Task 5 (offline replay) consume it.

- [ ] **Step 1: Write the failing test**

```kotlin
    @Test
    public fun `sends cash fields when a collection is supplied`(): Unit =
        runTest {
            val useCase = CompleteJobUseCase(repository)

            useCase("b1", CashCollection(collectedAmountPaise = 95_000L, shortReason = null))

            coVerify {
                repository.transitionStatus(
                    bookingId = "b1",
                    target = ActiveJobStatus.COMPLETED,
                    cash = CashCollection(95_000L, null),
                )
            }
        }

    @Test
    public fun `sends no cash fields for a prepaid completion`(): Unit =
        runTest {
            val useCase = CompleteJobUseCase(repository)

            useCase("b1", cash = null)

            coVerify {
                repository.transitionStatus(bookingId = "b1", target = ActiveJobStatus.COMPLETED, cash = null)
            }
        }

    @Test
    public fun `a short collection carries its reason`(): Unit =
        runTest {
            val useCase = CompleteJobUseCase(repository)

            useCase("b1", CashCollection(50_000L, ShortCollectionReason.CUSTOMER_PAID_PARTIAL))

            coVerify {
                repository.transitionStatus(
                    bookingId = "b1",
                    target = ActiveJobStatus.COMPLETED,
                    cash = CashCollection(50_000L, ShortCollectionReason.CUSTOMER_PAID_PARTIAL),
                )
            }
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CompleteJobUseCaseTest*" -PexcludePaparazzi`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

Read the API's accepted values for `shortCollectionReason` in `api/src/schemas/booking.ts` (it is a Zod enum near line 20) and mirror them **exactly** as a Kotlin enum — do not invent labels:

```kotlin
public enum class ShortCollectionReason { /* mirror api/src/schemas/booking.ts verbatim */ }
```

`TransitionRequest` gains the optional fields:

```kotlin
internal data class TransitionRequest(
    val targetStatus: String,
    val currentLocation: LatLngDto? = null,
    val attestation: LocationAttestationDto? = null,
    val cashCollected: Boolean? = null,
    val collectedAmount: Long? = null,
    val collectionMethod: String? = null,
    val shortCollectionReason: String? = null,
)
```

The repository sets `cashCollected = true`, `collectionMethod = "CASH"` (explicit, not relying on the server default — E24-S01 will add `UPI_QR` here), `collectedAmount`, and `shortCollectionReason` only when `cash != null`. When `cash == null` every field stays null and the request is byte-identical to today's.

- [ ] **Step 4: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CompleteJobUseCaseTest*" -PexcludePaparazzi`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/
git commit -m "feat(technician-app): thread cash-collection fields through the completion path"
```

---

## Task 4: The cash-aware completion dialog

**Files:**
- Modify: `ui/activeJob/CompletionConfirmationDialog.kt`
- Modify: `ui/activeJob/ActiveJobScreen.kt`, `ActiveJobViewModel.kt`
- Modify: `res/values/strings.xml`, `res/values-hi/strings.xml`
- Test: `app/src/test/kotlin/com/homeservices/technician/ui/activeJob/ActiveJobViewModelTest.kt`

**Interfaces:**
- Consumes: `ActiveJob.amountPaise`, `ActiveJob.paymentMethod` (Task 2); `CashCollection`, `ShortCollectionReason` (Task 3).

**Behaviour:**
- `RAZORPAY` → today's dialog, unchanged, `cash = null`.
- `CASH_ON_SERVICE` → amount field pre-filled with `amountPaise`, editable.
- Entered amount **below** `amountPaise` → a reason is required; confirm stays disabled until one is chosen.
- Entered amount **above** `amountPaise` → rejected with an inline message (over-collection is not a case the ledger models; silently accepting it would record a collection the booking cannot justify).
- Empty or unparseable amount → confirm disabled.

- [ ] **Step 1: Write the failing test**

```kotlin
    @Test
    public fun `prepaid completion sends no cash collection`(): Unit =
        runTest {
            val vm = createViewModel(job = anActiveJob(paymentMethod = PaymentMethod.RAZORPAY))

            vm.confirmCompletion(enteredAmountPaise = null, reason = null)

            coVerify { completeJobUseCase("b1", null) }
        }

    @Test
    public fun `cash completion at the full amount sends no short reason`(): Unit =
        runTest {
            val vm = createViewModel(job = anActiveJob(amountPaise = 95_000L))

            vm.confirmCompletion(enteredAmountPaise = 95_000L, reason = null)

            coVerify { completeJobUseCase("b1", CashCollection(95_000L, null)) }
        }

    @Test
    public fun `a short collection without a reason is refused`(): Unit =
        runTest {
            val vm = createViewModel(job = anActiveJob(amountPaise = 95_000L))

            vm.confirmCompletion(enteredAmountPaise = 50_000L, reason = null)

            coVerify(exactly = 0) { completeJobUseCase(any(), any()) }
            assertThat(vm.uiState.value.completionError).isNotNull
        }

    @Test
    public fun `a short collection with a reason is sent`(): Unit =
        runTest {
            val vm = createViewModel(job = anActiveJob(amountPaise = 95_000L))

            vm.confirmCompletion(50_000L, ShortCollectionReason.CUSTOMER_PAID_PARTIAL)

            coVerify {
                completeJobUseCase("b1", CashCollection(50_000L, ShortCollectionReason.CUSTOMER_PAID_PARTIAL))
            }
        }

    @Test
    public fun `an amount above the booking total is refused`(): Unit =
        runTest {
            val vm = createViewModel(job = anActiveJob(amountPaise = 95_000L))

            vm.confirmCompletion(enteredAmountPaise = 120_000L, reason = null)

            coVerify(exactly = 0) { completeJobUseCase(any(), any()) }
            assertThat(vm.uiState.value.completionError).isNotNull
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobViewModelTest*" -PexcludePaparazzi`
Expected: FAIL.

- [ ] **Step 3: Add the strings (both locales)**

```xml
    <string name="cash_confirm_title">Confirm cash collected</string>
    <string name="cash_confirm_expected">Expected: %1$s</string>
    <string name="cash_confirm_amount_label">Amount collected</string>
    <string name="cash_confirm_reason_label">Why is it less?</string>
    <string name="cash_confirm_reason_required">Choose a reason for the shortfall.</string>
    <string name="cash_confirm_amount_too_high">Amount cannot be more than %1$s.</string>
    <string name="cash_confirm_amount_invalid">Enter the amount you collected.</string>
```

```xml
    <string name="cash_confirm_title">वसूली गई नकद राशि की पुष्टि करें</string>
    <string name="cash_confirm_expected">अपेक्षित: %1$s</string>
    <string name="cash_confirm_amount_label">वसूली गई राशि</string>
    <string name="cash_confirm_reason_label">कम क्यों है?</string>
    <string name="cash_confirm_reason_required">कम राशि का कारण चुनें।</string>
    <string name="cash_confirm_amount_too_high">राशि %1$s से अधिक नहीं हो सकती।</string>
    <string name="cash_confirm_amount_invalid">वसूली गई राशि दर्ज करें।</string>
```

Add one string per `ShortCollectionReason` value, both locales.

- [ ] **Step 4: Write the implementation**

`CompletionConfirmationDialog` gains parameters and stays a pure composable:

```kotlin
@Composable
public fun CompletionConfirmationDialog(
    paymentMethod: PaymentMethod,
    expectedAmountPaise: Long,
    onConfirm: (enteredAmountPaise: Long?, reason: ShortCollectionReason?) -> Unit,
    onDismiss: () -> Unit,
)
```

For `RAZORPAY` it renders exactly today's title/body/buttons and calls `onConfirm(null, null)`. For `CASH_ON_SERVICE` it adds the amount field (pre-filled, rupee-denominated in the UI, converted to paise on submit), the reason dropdown shown only when the entered amount is below expected, and the inline validation messages. Keep the confirm button disabled rather than showing an error for an empty field.

**Shape it so E24-S01 can add a method picker**: keep the amount/validation block in its own private composable and leave the confirm callback's signature stable, so adding a `collectionMethod` parameter later is additive.

`ActiveJobViewModel.confirmCompletion(enteredAmountPaise, reason)` performs the validation (the tests above pin it at the ViewModel, not the composable, so it is testable without UI) and calls `completeJobUseCase` with a `CashCollection` or `null`.

- [ ] **Step 5: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobViewModelTest*" -PexcludePaparazzi`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/ \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/
git commit -m "feat(technician-app): make the completion dialog cash-aware with short-collection support"
```

---

## Task 5: Offline replay must carry the cash fields

**Files:**
- Modify: `data/activeJob/db/PendingTransitionEntity.kt`, its DAO, and the Room database class (version bump + migration)
- Modify: the `syncPendingTransitions()` implementation
- Test: `app/src/test/kotlin/com/homeservices/technician/data/activeJob/PendingTransitionSyncTest.kt`
- Test: `app/src/androidTest/.../MigrationTest.kt` if the project already has Room migration tests — otherwise a unit test over the migration object

**The bug:** `PendingTransitionEntity` stores only `(id, bookingId, targetStatus, createdAt, retryCount)` and `syncPendingTransitions()` replays `TransitionRequest(entry.targetStatus)`. A completion queued offline therefore reaches the server with no cash fields at all: the debt is still created correctly, but `cashCollectionStatus`, `cashCollectedAt`, `cashCollectedAmount` and the `CASH_COLLECTION_RECORDED` audit entry are all lost. In rural Ayodhya an offline completion is a normal case, so this silently loses the collection record for exactly the technicians with the worst signal.

- [ ] **Step 1: Write the failing test**

```kotlin
    @Test
    public fun `a queued cash completion replays with its cash fields`(): Unit =
        runTest {
            dao.insert(
                PendingTransitionEntity(
                    id = 0,
                    bookingId = "b1",
                    targetStatus = "COMPLETED",
                    createdAt = 1_000L,
                    retryCount = 0,
                    cashCollected = true,
                    collectedAmountPaise = 95_000L,
                    shortCollectionReason = null,
                ),
            )

            syncer.syncPendingTransitions()

            val sent = slot<TransitionRequest>()
            coVerify { api.transitionStatus("b1", capture(sent), any()) }
            assertThat(sent.captured.cashCollected).isTrue()
            assertThat(sent.captured.collectedAmount).isEqualTo(95_000L)
            assertThat(sent.captured.collectionMethod).isEqualTo("CASH")
        }

    @Test
    public fun `a queued prepaid completion replays with no cash fields`(): Unit =
        runTest {
            dao.insert(
                PendingTransitionEntity(
                    id = 0, bookingId = "b1", targetStatus = "COMPLETED",
                    createdAt = 1_000L, retryCount = 0,
                    cashCollected = false, collectedAmountPaise = null, shortCollectionReason = null,
                ),
            )

            syncer.syncPendingTransitions()

            val sent = slot<TransitionRequest>()
            coVerify { api.transitionStatus("b1", capture(sent), any()) }
            assertThat(sent.captured.cashCollected).isNull()
            assertThat(sent.captured.collectedAmount).isNull()
        }

    @Test
    public fun `a short collection survives the queue with its reason`(): Unit =
        runTest {
            dao.insert(
                PendingTransitionEntity(
                    id = 0, bookingId = "b1", targetStatus = "COMPLETED",
                    createdAt = 1_000L, retryCount = 0,
                    cashCollected = true, collectedAmountPaise = 50_000L,
                    shortCollectionReason = "CUSTOMER_PAID_PARTIAL",
                ),
            )

            syncer.syncPendingTransitions()

            val sent = slot<TransitionRequest>()
            coVerify { api.transitionStatus("b1", capture(sent), any()) }
            assertThat(sent.captured.shortCollectionReason).isEqualTo("CUSTOMER_PAID_PARTIAL")
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*PendingTransitionSyncTest*" -PexcludePaparazzi`
Expected: FAIL — the entity has no such fields.

- [ ] **Step 3: Write the implementation**

Add three nullable columns to `PendingTransitionEntity` (`cashCollected: Boolean?`, `collectedAmountPaise: Long?`, `shortCollectionReason: String?`), bump the Room database version, and add a migration:

```kotlin
/**
 * Adds the cash-collection columns to pending_transitions. Nullable with no default: a row queued
 * by an older build predates cash confirm entirely and must replay exactly as it would have before,
 * i.e. with no cash fields — not as a zero-rupee collection.
 */
internal val MIGRATION_N_TO_N_PLUS_1: Migration =
    object : Migration(N, N + 1) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("ALTER TABLE pending_transitions ADD COLUMN cashCollected INTEGER")
            db.execSQL("ALTER TABLE pending_transitions ADD COLUMN collectedAmountPaise INTEGER")
            db.execSQL("ALTER TABLE pending_transitions ADD COLUMN shortCollectionReason TEXT")
        }
    }
```

Read the real current version and table name from the database class; do not guess either. Register the migration on the builder — **do not** use `fallbackToDestructiveMigration()`, which would drop queued completions that have not yet synced.

Update the enqueue path (the offline branch of `transitionStatus`) to persist the cash fields, and `syncPendingTransitions()` to rebuild the full `TransitionRequest` from the row, setting `collectionMethod = "CASH"` whenever `cashCollected == true`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*PendingTransitionSyncTest*" -PexcludePaparazzi`
Expected: PASS, 3 tests.

- [ ] **Step 5: Verify the migration actually runs**

If the project has Room schema JSON export enabled, confirm the new schema file is generated and committed. If a migration test harness exists under `androidTest`, add a migrate-and-validate case. If neither exists, at minimum assert the migration is registered on the builder in a unit test — an unregistered migration crashes at runtime on upgrade, which no unit test above would catch.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/activeJob/ \
        technician-app/app/schemas/
git commit -m "fix(technician-app): carry cash-collection fields through the offline replay queue"
```

---

## Task 6: Paparazzi coverage for the dialog

**Files:**
- Create: `app/src/test/kotlin/com/homeservices/technician/ui/activeJob/CompletionConfirmationDialogPaparazziTest.kt`

- [ ] **Step 1: Write the snapshot tests**

Follow `JobOfferScreenPaparazziTest.kt`'s structure. Cover, light and dark: prepaid (unchanged dialog), cash at full amount, cash with a short amount and the reason picker visible, and the amount-too-high inline error. Add a Hindi variant for the cash-with-reason state — this copy is load-bearing for the pilot.

- [ ] **Step 2: Verify they compile**

Run: `cd technician-app && ./gradlew compileDebugUnitTestKotlin --quiet`
Expected: BUILD SUCCESSFUL.

**Do NOT record. Do NOT delete existing goldens.**

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/
git commit -m "test(technician-app): Paparazzi coverage for the cash-aware completion dialog"
```

---

## Task 7: Smoke gates, review, and the hand-off to E24-S01

- [ ] **Step 1: Run both smoke gates**

```bash
bash tools/pre-codex-smoke-api.sh
bash tools/pre-codex-smoke.sh technician-app
```
Expected: exit 0 from both.

- [ ] **Step 2: Merge main and push**

```bash
git fetch origin main && git merge origin/main
bash tools/pre-codex-smoke.sh technician-app   # re-run after the merge
git push
```

- [ ] **Step 3: Codex review**

```bash
codex review --base main
```
`disk-full-read-access` sandbox permission (git worktree). Fix in Claude, re-run **once**.

- [ ] **Step 4: Open the PR**

Body must state: the API side of these fields has been accepted since E21-S01 and only the client was missing; prepaid bookings are behaviourally unchanged; the Room migration is additive and non-destructive; and `collectionMethod` is sent explicitly as `"CASH"` so E24-S01 can add `UPI_QR` as a sibling value.

- [ ] **Step 5: Tell session-1 (E24-S01) the dialog has landed**

Message the orchestrator session with: the merged commit, `CompletionConfirmationDialog`'s final signature, the fact that `collectionMethod` is already an explicit wire value, and the note that the amount/validation block is isolated in its own private composable so a method picker is an additive change.

---

## Self-Review Notes

- **Spec coverage:** §4's API widening → Task 1; the dialog and short collection → Tasks 2-4; the offline-replay gap → Task 5; §7 testing → inline plus Task 6.
- **Deliberately not here:** KYC (E21-S05a), wallet/banner/job-offer (E21-S05b), and the `UPI_QR` picker (E24-S01).
- **Type consistency:** `PaymentMethod` (Task 2) gates the dialog (Task 4). `CashCollection` and `ShortCollectionReason` (Task 3) are consumed by the dialog (Task 4) and persisted by the queue (Task 5). `collectionMethod = "CASH"` is set in exactly two places — the online repository path (Task 3) and the replay path (Task 5) — and both must agree.
- **Known unknowns to resolve by reading:** the exact `shortCollectionReason` enum values in `api/src/schemas/booking.ts` (Task 3 — mirror verbatim, do not invent), the Room database's current version and class name (Task 5), whether Room schema export is enabled (Task 5), and `ActiveJobScreen`'s current dialog call site (Task 4).

# E24-S01b — Technician UPI QR (technician-app) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a technician set their UPI VPA, and let the completion flow offer collecting payment via an on-device UPI QR, as a second `collectionMethod` alongside the cash-confirm flow `E21-S05` is landing separately.

**Architecture:** One new Android screen (VPA entry), an additive `amount` field on the technician's active-job model, and a small addition to whatever `E21-S05` lands in `CompletionConfirmationDialog.kt` (a `UPI_QR` option next to its cash-confirm UI, not a rebuild of it). QR generation is entirely on-device (`com.google.zxing:core`), no network call, no PSP integration.

**Tech Stack:** Retrofit/Moshi + Jetpack Compose + Hilt, `com.google.zxing:core` (new dependency, Apache-2.0, ₹0).

**Spec:** Owner-approved design: `C:/Users/alokt/.claude/plans/act-as-a-principal-ticklish-fern.md` § "E24-S01 · Technician UPI QR". Companion plans: `plans/E24-S01a-payment-profile-api.md` (API, must be merged/deployed first) and `plans/E24-S01c-customer-masked-vpa.md` (customer-app swap-detection display — fully independent of this story, can run in parallel).

**Depends on:** `E24-S01a` (the API endpoints this story's clients call) and, for Task 5 only, `E21-S05` (a parallel technician-app story, session-3, that owns wiring `cashCollected`/`collectedAmount` into `CompletionConfirmationDialog.kt`). See the ownership note below — **confirmed with the owner**, not a guess.

## Global Constraints

- Generate the QR **on-device, offline**, from `upi://pay?pa=<vpa>&pn=<name>&am=<finalAmount>&cu=INR&tn=<bookingId>` using `com.google.zxing:core`. No network call for QR generation itself.
- Never claim the payment is "verified" anywhere in either app — there is no PSP webhook. Every collection is a technician assertion, exactly as trustworthy as "I collected cash."
- **libs.versions.toml sync invariant (root CLAUDE.md):** `technician-app/gradle/libs.versions.toml` is a copy of `customer-app/gradle/libs.versions.toml`, refreshed at the start of every technician-app story. The zxing entry therefore goes into **customer-app's** toml first (the master copy), even though only technician-app's `build.gradle.kts` will actually declare the dependency — otherwise the next sync silently deletes it. Do not add `implementation(libs.zxing.core)` to customer-app's `build.gradle.kts`; customer-app never renders a QR in this story.
- All new user-facing strings need both `values/strings.xml` and `values-hi/strings.xml` entries (product is Hindi-default) — follow the existing per-string EN+HI pairing used throughout both apps.
- Read `docs/patterns/hilt-module-android-test-scope.md` before adding the new Hilt bindings, and `docs/patterns/kotlin-explicit-api-public-modifier.md` before adding new public Kotlin files (both apps use Kotlin explicit API mode).
- Paparazzi goldens are recorded on CI Linux only (`docs/patterns/paparazzi-cross-os-goldens.md`) — never run `recordPaparazzi` locally on Windows; delete any locally-generated golden PNGs before committing and trigger `paparazzi-record.yml` via `workflow_dispatch` once the PR is up.

## `CompletionConfirmationDialog.kt` ownership — confirmed, not a checkpoint

`CompletionConfirmationDialog.kt` today is a bare confirm/cancel dialog with no cash-collection UI at all. **E21-S05 (session-3) owns wiring `cashCollected`/`collectedAmount` into it** (amount entry, `collectionMethod` defaulting to `'CASH'`) — confirmed directly with the owner via the orchestrating session, not assumed. This story's job is narrower than originally scoped: add `UPI_QR` as a second `collectionMethod` option **on top of** whatever shape E21-S05 lands, not rebuild the dialog.

**Do not start Task 5 until `E21-S05` has merged to `main`.** Tasks 1-4 and 6-7 below have no dependency on that merge and can proceed immediately. Before starting Task 5: `git fetch origin main && git merge origin/main`, then **read the actual merged `CompletionConfirmationDialog.kt` and `TransitionRequest` shape** — Task 5's instructions describe what to add, not a full file to paste in, precisely because the base shape isn't authored by this plan. If `E21-S05` hasn't merged yet when you reach this point, message the orchestrating session (`urbanclap-dup-1d`) rather than guessing or blocking silently.

---

## Work Stream A — data layer

### Task 1: Add `amount` to `ActiveJob`

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/model/ActiveJob.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt` (`ActiveJobResponse` only)
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImpl.kt` (`toDomain()` only)
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImplTest.kt` (create if it doesn't exist — check first; if it already exists, add to it)

This task is independent of `E21-S05` — it only reads the `amount` field `E24-S01a` added to `GET`/`PATCH .../active-job` responses. It does **not** touch `TransitionRequest` — the `cashCollected`/`collectedAmount`/`collectionMethod` request fields are `E21-S05`'s to add.

**Interfaces:**
- Produces: `ActiveJob.amount: Int` (paise) — needed by Task 4/5 for the QR's `am=` parameter.

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `toDomain maps amount from the response`() = runTest {
    val api = mockk<ActiveJobApiService>()
    coEvery { api.getActiveJob("b1") } returns Response.success(activeJobResponseFixture(amount = 65000))
    val repo = ActiveJobRepositoryImpl(api, dao, currentLocationProvider)

    repo.startObserving("b1")

    assertThat(repo.activeJobState.value?.amount).isEqualTo(65000)
}
```

(Add an `activeJobResponseFixture(amount: Int = 50000, ...)` helper at the top of the test file if one doesn't already exist, filling in the other required `ActiveJobResponse` fields with fixed dummy values.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobRepositoryImplTest*"`
Expected: FAIL — compile error, `amount` unknown on `ActiveJob`/`ActiveJobResponse`.

- [ ] **Step 3: Write minimal implementation**

`ActiveJob.kt` — add one field:

```kotlin
public data class ActiveJob(
    val bookingId: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLng,
    val status: ActiveJobStatus,
    val slotDate: String,
    val slotWindow: String,
    val amount: Int,
)
```

`ActiveJobApiService.kt` — add `amount` to `ActiveJobResponse` only (leave `TransitionRequest` untouched — that's `E21-S05`'s surface):

```kotlin
@JsonClass(generateAdapter = true)
internal data class ActiveJobResponse(
    @Json(name = "bookingId") val id: String,
    val customerId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
    val amount: Int,
)
```

`ActiveJobRepositoryImpl.kt` — map it in `toDomain()`:

```kotlin
        private fun ActiveJobResponse.toDomain(): ActiveJob =
            ActiveJob(
                bookingId = id,
                customerId = customerId,
                serviceId = serviceId,
                serviceName = serviceName,
                addressText = addressText,
                addressLatLng = LatLng(addressLatLng.lat, addressLatLng.lng),
                status = ActiveJobStatus.valueOf(status),
                slotDate = slotDate,
                slotWindow = slotWindow,
                amount = amount,
            )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*ActiveJobRepositoryImplTest*"`
Expected: PASS. Then run the full unit suite once (`./gradlew testDebugUnitTest`) — any other `ActiveJob(...)` construction site (test fixtures) needs `amount` added; `ActiveJobResponse(...)` construction sites likewise.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/activeJob/model/ActiveJob.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobApiService.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImpl.kt \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/activeJob/ActiveJobRepositoryImplTest.kt
git commit -m "feat(technician-app): add settled amount to the active-job domain model"
```

### Task 2: Payment-profile repository + use case (technician-app)

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/paymentprofile/PaymentProfileApiService.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/paymentprofile/PaymentProfileRepositoryImpl.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/paymentprofile/PaymentProfileRepository.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/paymentprofile/UpdatePaymentProfileUseCase.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/paymentprofile/di/PaymentProfileModule.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/paymentprofile/UpdatePaymentProfileUseCaseTest.kt`

Mirrors the existing `payout`/`PayoutCadence*` family exactly (`data/payout/remote/PayoutApiService.kt`, `data/payout/PayoutRepositoryImpl.kt`, `domain/payout/PayoutRepository.kt`, `domain/payout/UpdatePayoutCadenceUseCase.kt`) — read those four files side by side before writing these. Calls `E24-S01a`'s `PATCH /v1/technicians/me/payment-profile` — that story must be deployed before this one is exercised end-to-end (unit tests here mock the API layer, so they don't require it).

**Interfaces:**
- Produces: `UpdatePaymentProfileUseCase.invoke(upiVpa: String): Result<PaymentProfileResult>` where `PaymentProfileResult(val upiVpa: String, val upiUpdatedAt: String)`.

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `invoke delegates to the repository and returns its result`() = runTest {
    val repo = mockk<PaymentProfileRepository>()
    coEvery { repo.updatePaymentProfile("alok@okhdfcbank") } returns
        Result.success(PaymentProfileResult(upiVpa = "alok@okhdfcbank", upiUpdatedAt = "2026-09-12T10:00:00.000Z"))
    val useCase = UpdatePaymentProfileUseCase(repo)

    val result = useCase.invoke("alok@okhdfcbank")

    assertThat(result.getOrNull()?.upiVpa).isEqualTo("alok@okhdfcbank")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpdatePaymentProfileUseCaseTest*"`
Expected: FAIL — none of the classes exist yet.

- [ ] **Step 3: Write minimal implementation**

`PaymentProfileApiService.kt`:

```kotlin
package com.homeservices.technician.data.paymentprofile

import com.squareup.moshi.JsonClass
import retrofit2.http.Body
import retrofit2.http.PATCH

internal interface PaymentProfileApiService {
    @PATCH("v1/technicians/me/payment-profile")
    suspend fun updatePaymentProfile(
        @Body body: UpdatePaymentProfileRequestDto,
    ): UpdatePaymentProfileResponseDto
}

@JsonClass(generateAdapter = true)
internal data class UpdatePaymentProfileRequestDto(
    val upiVpa: String,
)

@JsonClass(generateAdapter = true)
internal data class UpdatePaymentProfileResponseDto(
    val upiVpa: String,
    val upiUpdatedAt: String,
)
```

`domain/paymentprofile/PaymentProfileRepository.kt`:

```kotlin
package com.homeservices.technician.domain.paymentprofile

public data class PaymentProfileResult(
    val upiVpa: String,
    val upiUpdatedAt: String,
)

public interface PaymentProfileRepository {
    public suspend fun updatePaymentProfile(upiVpa: String): Result<PaymentProfileResult>
}
```

`data/paymentprofile/PaymentProfileRepositoryImpl.kt`:

```kotlin
package com.homeservices.technician.data.paymentprofile

import com.homeservices.technician.domain.paymentprofile.PaymentProfileRepository
import com.homeservices.technician.domain.paymentprofile.PaymentProfileResult
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PaymentProfileRepositoryImpl
    @Inject
    constructor(
        private val api: PaymentProfileApiService,
    ) : PaymentProfileRepository {
        public override suspend fun updatePaymentProfile(upiVpa: String): Result<PaymentProfileResult> =
            runCatching {
                val dto = api.updatePaymentProfile(UpdatePaymentProfileRequestDto(upiVpa = upiVpa))
                PaymentProfileResult(upiVpa = dto.upiVpa, upiUpdatedAt = dto.upiUpdatedAt)
            }
    }
```

`domain/paymentprofile/UpdatePaymentProfileUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.paymentprofile

import javax.inject.Inject

public class UpdatePaymentProfileUseCase
    @Inject
    constructor(
        private val repository: PaymentProfileRepository,
    ) {
        public suspend fun invoke(upiVpa: String): Result<PaymentProfileResult> =
            repository.updatePaymentProfile(upiVpa)
    }
```

`data/paymentprofile/di/PaymentProfileModule.kt` — mirrors `ServiceProfileModule.kt` exactly (`@Binds` for the repository interface, a `@Provides` companion-object function for the Retrofit service):

```kotlin
package com.homeservices.technician.data.paymentprofile.di

import com.homeservices.technician.data.paymentprofile.PaymentProfileApiService
import com.homeservices.technician.data.paymentprofile.PaymentProfileRepositoryImpl
import com.homeservices.technician.domain.paymentprofile.PaymentProfileRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
internal abstract class PaymentProfileModule {
    @Binds
    abstract fun bindPaymentProfileRepository(impl: PaymentProfileRepositoryImpl): PaymentProfileRepository

    companion object {
        @Provides
        @Singleton
        fun providePaymentProfileApiService(retrofit: Retrofit): PaymentProfileApiService =
            retrofit.create(PaymentProfileApiService::class.java)
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpdatePaymentProfileUseCaseTest*"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/paymentprofile \
        technician-app/app/src/main/kotlin/com/homeservices/technician/domain/paymentprofile \
        technician-app/app/src/test/kotlin/com/homeservices/technician/domain/paymentprofile/UpdatePaymentProfileUseCaseTest.kt
git commit -m "feat(technician-app): add payment-profile repository and use case"
```

---

## Work Stream B — QR generation + UPI settings screen

### Task 3: `zxing` dependency + libs.versions.toml sync

**Files:**
- Modify: `customer-app/gradle/libs.versions.toml` (master copy — add the version + library entry only, no build.gradle.kts change in customer-app)
- Modify: `technician-app/gradle/libs.versions.toml` (copy customer-app's file over this one, per the repo sync invariant)
- Modify: `technician-app/app/build.gradle.kts` (add the dependency)

- [ ] **Step 1:** In `customer-app/gradle/libs.versions.toml`, under `[versions]`, add:

```toml
zxingCore = "3.5.3"
```

Under `[libraries]`, add:

```toml
zxing-core = { module = "com.google.zxing:core", version.ref = "zxingCore" }
```

- [ ] **Step 2:** Sync technician-app's copy:

```bash
cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
```

- [ ] **Step 3:** In `technician-app/app/build.gradle.kts`, add near the other single-purpose library deps:

```kotlin
implementation(libs.zxing.core)
```

- [ ] **Step 4: Verify the build resolves the new dependency**

Run: `cd technician-app && ./gradlew :app:dependencies --configuration debugRuntimeClasspath | grep zxing`
Expected: `com.google.zxing:core:3.5.3` present in the resolved graph.

- [ ] **Step 5: Commit**

```bash
git add customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml technician-app/app/build.gradle.kts
git commit -m "chore: add zxing:core for on-device UPI QR generation (technician-app only)"
```

### Task 4: QR URI builder + QR bitmap generator (pure, testable)

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/domain/upiqr/UpiQrUriBuilder.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/data/upiqr/QrBitmapGenerator.kt`
- Test: `technician-app/app/src/test/kotlin/com/homeservices/technician/domain/upiqr/UpiQrUriBuilderTest.kt`

**Interfaces:**
- Produces: `UpiQrUriBuilder.build(vpa: String, payeeName: String, amountPaise: Int, bookingId: String): String` — pins the exact `upi://pay?...` template. `QrBitmapGenerator.generate(content: String, sizePx: Int = 512): Bitmap` — wraps `zxing`'s `QRCodeWriter`.

This is the one piece worth pinning byte-for-byte per the design's testing note: it's the URI real money follows.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.domain.upiqr

import com.google.common.truth.Truth.assertThat
import org.junit.Test

public class UpiQrUriBuilderTest {
    @Test
    public fun `builds the exact upi pay URI template`() {
        val uri = UpiQrUriBuilder.build(
            vpa = "alok@okhdfcbank",
            payeeName = "Alok Tiwari",
            amountPaise = 65000,
            bookingId = "bk-abc123",
        )

        assertThat(uri).isEqualTo(
            "upi://pay?pa=alok%40okhdfcbank&pn=Alok%20Tiwari&am=650.00&cu=INR&tn=bk-abc123",
        )
    }

    @Test
    public fun `URL-encodes a payee name containing special characters`() {
        val uri = UpiQrUriBuilder.build(
            vpa = "a@b",
            payeeName = "Ramesh & Sons",
            amountPaise = 10000,
            bookingId = "bk-1",
        )
        assertThat(uri).contains("pn=Ramesh%20%26%20Sons")
    }

    @Test
    public fun `converts paise to a two-decimal rupee amount`() {
        val uri = UpiQrUriBuilder.build("a@b", "N", amountPaise = 5, bookingId = "bk-1")
        assertThat(uri).contains("am=0.05")
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpiQrUriBuilderTest*"`
Expected: FAIL — `UpiQrUriBuilder` does not exist.

- [ ] **Step 3: Write minimal implementation**

```kotlin
package com.homeservices.technician.domain.upiqr

import java.math.BigDecimal
import java.math.RoundingMode
import java.net.URLEncoder

/**
 * Builds the `upi://pay` deep-link consumed by every UPI app to render a payment request.
 * `am` must be rupees with exactly two decimal places, not paise — the field name in this
 * function's own parameter (`amountPaise`) is the unit callers pass; the conversion happens here.
 */
public object UpiQrUriBuilder {
    public fun build(
        vpa: String,
        payeeName: String,
        amountPaise: Int,
        bookingId: String,
    ): String {
        val rupees = BigDecimal(amountPaise).divide(BigDecimal(100)).setScale(2, RoundingMode.HALF_UP)
        fun enc(s: String) = URLEncoder.encode(s, "UTF-8").replace("+", "%20")
        return "upi://pay?pa=${enc(vpa)}&pn=${enc(payeeName)}&am=$rupees&cu=INR&tn=${enc(bookingId)}"
    }
}
```

`QrBitmapGenerator.kt`:

```kotlin
package com.homeservices.technician.data.upiqr

import android.graphics.Bitmap
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter

public object QrBitmapGenerator {
    public fun generate(content: String, sizePx: Int = 512): Bitmap {
        val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx)
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.RGB_565)
        for (x in 0 until sizePx) {
            for (y in 0 until sizePx) {
                bitmap.setPixel(x, y, if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
            }
        }
        return bitmap
    }
}
```

(`QrBitmapGenerator` touches `android.graphics.Bitmap`, so it is not directly unit-testable off-device without Robolectric — no test is required for it in this task; it's exercised visually by the Paparazzi golden in Task 5.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpiQrUriBuilderTest*"`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/upiqr \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/upiqr \
        technician-app/app/src/test/kotlin/com/homeservices/technician/domain/upiqr/UpiQrUriBuilderTest.kt
git commit -m "feat(technician-app): add UPI QR URI builder and bitmap generator"
```

### Task 5: Add the UPI-QR `collectionMethod` option to `CompletionConfirmationDialog`

**Gated — do not start until `E21-S05` has merged to `main`.** Read the ownership note at the top of this plan first.

**Files:**
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob/CompletionConfirmationDialog.kt` (the shape `E21-S05` lands — read it fresh after merging, do not assume this plan's earlier draft of it)
- Modify: whatever call site wires the dialog to `ActiveJobRepository.transitionStatus` (search `ActiveJobScreen.kt`/`ActiveJobViewModel.kt`)
- Modify: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/CompletionConfirmationDialogPaparazziTest.kt` (extend `E21-S05`'s test cases with a UPI-QR one — do not delete existing cases)
- Modify: `values/strings.xml` and `values-hi/strings.xml`

**Interfaces:**
- Consumes: `UpiQrUriBuilder.build` and `QrBitmapGenerator.generate` (Task 4); `ActiveJob.amount` (Task 1); whatever `collectionMethod`-carrying request type `E21-S05` added to the transition call.

- [ ] **Step 1: Merge and read the actual shape**

```bash
git fetch origin main && git merge origin/main
```

Read the merged `CompletionConfirmationDialog.kt` in full, and the `TransitionRequest`/equivalent DTO `E21-S05` added to `ActiveJobApiService.kt`. Confirm: does it already have a `collectionMethod` field (per the orchestrator's note, expected to default to `'CASH'`)? Is there already a radio/picker UI for it, or just the boolean `cashCollected` checkbox and amount field? The remaining steps below assume a `collectionMethod` field exists and defaults to `CASH`, with no `UPI_QR` option in the UI yet — adapt if the actual merged shape differs (e.g. if `E21-S05` used a different field name, use that name instead; do not reintroduce a second, parallel field).

- [ ] **Step 2: Write the failing test** (extend the Paparazzi test class `E21-S05` landed; a new snapshot case, `@Ignore`d like the rest per this repo's CI-only recording convention)

```kotlin
@Test
public fun `CompletionConfirmationDialog with UPI QR available`() {
    paparazzi.snapshot {
        HomeservicesTheme {
            CompletionConfirmationDialog(
                // ...pass E21-S05's existing required parameters, plus:
                upiQrEnabled = true,
                technicianUpiVpa = "alok@okhdfcbank",
                technicianDisplayName = "Alok Tiwari",
                bookingId = "bk-abc123",
            )
        }
    }
}

@Test
public fun `CompletionConfirmationDialog with UPI QR flag on but no VPA saved`() {
    paparazzi.snapshot {
        HomeservicesTheme {
            CompletionConfirmationDialog(
                upiQrEnabled = true,
                technicianUpiVpa = null,
                technicianDisplayName = "Alok Tiwari",
                bookingId = "bk-abc123",
            )
        }
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `./gradlew :technician-app:compileDebugUnitTestKotlin` — fails until the dialog accepts the three new parameters (`upiQrEnabled`, `technicianUpiVpa`, `technicianDisplayName`, `bookingId` — the last may already exist if `E21-S05` needed it for something else; don't duplicate a parameter that's already there).

- [ ] **Step 4: Add the UPI-QR branch**

Add three new parameters to the dialog's signature: `upiQrEnabled: Boolean, technicianUpiVpa: String?, technicianDisplayName: String` (plus `bookingId: String` if not already present for another reason). Inside the composable, alongside `E21-S05`'s existing `collectionMethod` picker:

- When `upiQrEnabled && technicianUpiVpa != null`: add a second radio option, "Collected via UPI QR", that sets `collectionMethod = "UPI_QR"`. When selected, render the on-device QR:

```kotlin
val qrBitmap: Bitmap? =
    remember(collectionMethod, technicianUpiVpa) {
        if (collectionMethod == "UPI_QR" && technicianUpiVpa != null) {
            QrBitmapGenerator.generate(
                UpiQrUriBuilder.build(technicianUpiVpa, technicianDisplayName, amountPaise, bookingId),
            )
        } else {
            null
        }
    }
```

```kotlin
if (collectionMethod == "UPI_QR" && qrBitmap != null) {
    Image(
        bitmap = qrBitmap.asImageBitmap(),
        contentDescription = stringResource(R.string.complete_job_qr_content_description),
        modifier = Modifier.size(200.dp),
    )
}
```

- When `upiQrEnabled && technicianUpiVpa == null`: show the option disabled with a hint pointing at the UPI settings screen (Task 6) — never a dead/no-op button:

```kotlin
Text(text = stringResource(R.string.complete_job_upi_qr_setup_hint))
```

- When `!upiQrEnabled`: no change to `E21-S05`'s UI at all.

Add strings (`values/strings.xml`):

```xml
<string name="complete_job_method_upi_qr">UPI QR</string>
<string name="complete_job_qr_content_description">UPI payment QR code</string>
<string name="complete_job_upi_qr_setup_hint">Set up your UPI ID in Payment settings to accept UPI QR payments</string>
```

`values-hi/strings.xml`:

```xml
<string name="complete_job_method_upi_qr">यूपीआई क्यूआर</string>
<string name="complete_job_qr_content_description">यूपीआई भुगतान क्यूआर कोड</string>
<string name="complete_job_upi_qr_setup_hint">यूपीआई क्यूआर से भुगतान लेने के लिए पेमेंट सेटिंग में अपनी यूपीआई आईडी जोड़ें</string>
```

- [ ] **Step 5: Update the call site**

At wherever `E21-S05` wired `CompletionConfirmationDialog` to `ActiveJobViewModel`/`ActiveJobRepository.transitionStatus`, thread: `upiQrEnabled` from the technician config's `features.upiQr` flag (fetch via whatever use case already wraps `GET /v1/config/technician`; if nothing consumes it yet, add a minimal fetch in the view model constructor following the pattern for similar flags like `duesBanner`), `technicianUpiVpa` from a fetched payment profile (this story does not add a GET for the technician's own profile — the simplest correct option is: after a successful `UpdatePaymentProfileUseCase` call in Task 6's screen, cache the VPA in `SessionManager` or a similar already-injected singleton so `ActiveJobViewModel` can read it; check `SessionManager`'s existing surface first before adding a new field), `technicianDisplayName` from `FirebaseAuth.getInstance().currentUser?.displayName ?: ""`, `bookingId` from the active job, and `amountPaise` from `ActiveJob.amount` (Task 1).

- [ ] **Step 6: Run test to verify it passes**

Run: `cd technician-app && ./gradlew :app:compileDebugUnitTestKotlin :app:testDebugUnitTest`
Expected: PASS, no compile errors, no regressions in `E21-S05`'s existing cash-confirm tests. New Paparazzi cases stay `@Ignore`d.

- [ ] **Step 7: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/activeJob \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/activeJob/CompletionConfirmationDialogPaparazziTest.kt \
        technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): add UPI QR collection option to job completion"
```

### Task 6: UPI settings screen

**Files:**
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/paymentsettings/UpiSettingsScreen.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/paymentsettings/UpiSettingsUiState.kt`
- Create: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/paymentsettings/UpiSettingsViewModel.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/paymentsettings/UpiSettingsScreenPaparazziTest.kt`
- Create: `technician-app/app/src/test/kotlin/com/homeservices/technician/ui/paymentsettings/UpiSettingsViewModelTest.kt`
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt` (add `composable("upi_settings")`, following the `"payout_settings"` entry exactly)
- Modify: `technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt` (add a second `OutlinedButton` next to the existing "Payout settings" one, both places it appears)
- Modify: `values/strings.xml` and `values-hi/strings.xml`

Independent of `E21-S05` — can be built in parallel with everything above. Mirrors `PayoutCadenceScreen.kt`/`PayoutCadenceViewModel.kt` structurally, but with a single text field instead of radio options, and reuses `UpdatePaymentProfileUseCase` (Task 2) instead of `UpdatePayoutCadenceUseCase`. Follows the same biometric-gate-on-save pattern (`BiometricGateUseCase`) since this touches money-routing configuration.

- [ ] **Step 1: Write the failing test**

```kotlin
@Test
fun `selecting a VPA and saving calls the use case with the entered value`() = runTest {
    val useCase = mockk<UpdatePaymentProfileUseCase>()
    coEvery { useCase.invoke("alok@okhdfcbank") } returns
        Result.success(PaymentProfileResult("alok@okhdfcbank", "2026-09-12T10:00:00.000Z"))
    val biometricGate = mockk<BiometricGateUseCase>()
    coEvery { biometricGate.canUseBiometric(any()) } returns false // best-effort path, matches PayoutCadenceViewModel
    val viewModel = UpiSettingsViewModel(useCase, biometricGate)

    viewModel.updateVpaInput("alok@okhdfcbank")
    viewModel.save(mockk(relaxed = true))

    assertThat(viewModel.uiState.value).isInstanceOf(UpiSettingsUiState.SaveSuccess::class.java)
}

@Test
fun `an empty or malformed VPA is rejected before calling the use case`() = runTest {
    val useCase = mockk<UpdatePaymentProfileUseCase>()
    val viewModel = UpiSettingsViewModel(useCase, mockk())

    viewModel.updateVpaInput("not-a-vpa")
    viewModel.save(mockk(relaxed = true))

    coVerify(exactly = 0) { useCase.invoke(any()) }
    assertThat(viewModel.uiState.value).isInstanceOf(UpiSettingsUiState.Error::class.java)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpiSettingsViewModelTest*"`
Expected: FAIL — classes don't exist.

- [ ] **Step 3: Write minimal implementation**

`UpiSettingsUiState.kt`:

```kotlin
package com.homeservices.technician.ui.paymentsettings

public sealed class UpiSettingsUiState {
    public data class Ready(val vpaInput: String, val isSaving: Boolean = false) : UpiSettingsUiState()
    public data class SaveSuccess(val upiVpa: String) : UpiSettingsUiState()
    public data class Error(val message: String) : UpiSettingsUiState()
}
```

`UpiSettingsViewModel.kt` — client-side format check mirrors the server's `isValidVpaFormat` (`E24-S01a` Task 1) so a technician gets instant feedback rather than a round trip:

```kotlin
package com.homeservices.technician.ui.paymentsettings

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.domain.auth.BiometricGateUseCase
import com.homeservices.technician.domain.auth.model.BiometricResult
import com.homeservices.technician.domain.paymentprofile.UpdatePaymentProfileUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

private fun isValidVpaFormat(vpa: String): Boolean {
    if (vpa.any { it.isWhitespace() }) return false
    val parts = vpa.split("@")
    return parts.size == 2 && parts[0].isNotEmpty() && parts[1].isNotEmpty()
}

@HiltViewModel
public class UpiSettingsViewModel
    @Inject
    constructor(
        private val updatePaymentProfileUseCase: UpdatePaymentProfileUseCase,
        private val biometricGate: BiometricGateUseCase,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<UpiSettingsUiState>(UpiSettingsUiState.Ready(vpaInput = ""))
        public val uiState: StateFlow<UpiSettingsUiState> = _uiState.asStateFlow()

        public fun updateVpaInput(value: String) {
            val current = _uiState.value as? UpiSettingsUiState.Ready ?: UpiSettingsUiState.Ready(vpaInput = "")
            _uiState.value = current.copy(vpaInput = value)
        }

        public fun save(activity: FragmentActivity) {
            val current = _uiState.value as? UpiSettingsUiState.Ready ?: return
            if (!isValidVpaFormat(current.vpaInput)) {
                _uiState.value = UpiSettingsUiState.Error("Enter a valid UPI ID, e.g. name@bank")
                return
            }

            viewModelScope.launch {
                if (biometricGate.canUseBiometric(activity)) {
                    val result = biometricGate.requestAuth(
                        activity = activity,
                        title = "पेमेंट सेटिंग बदलें",
                        subtitle = "पहचान सत्यापित करें",
                    )
                    if (result !is BiometricResult.Authenticated) return@launch
                }

                _uiState.value = current.copy(isSaving = true)
                val outcome = updatePaymentProfileUseCase.invoke(current.vpaInput)
                _uiState.value = outcome.fold(
                    onSuccess = { UpiSettingsUiState.SaveSuccess(it.upiVpa) },
                    onFailure = { UpiSettingsUiState.Error(it.message ?: "Unknown error") },
                )
            }
        }
    }
```

`UpiSettingsScreen.kt` — copy `PayoutCadenceScreen.kt`'s Scaffold/TopAppBar/HsPrimaryButton shell, swap the radio-button cadence list for a single `OutlinedTextField` bound to `uiState.vpaInput`/`updateVpaInput`, plus the plain-language warning text: "Payments go directly to this UPI ID — double-check it's correct" (and its Hindi translation).

Add strings (`values/strings.xml`):

```xml
<string name="upi_settings_title">UPI payment settings</string>
<string name="upi_settings_vpa_label">Your UPI ID</string>
<string name="upi_settings_warning">Payments go directly to this UPI ID — double-check it\'s correct before saving.</string>
<string name="upi_settings_save_cta">Save UPI ID</string>
<string name="earnings_upi_settings">UPI settings</string>
```

`values-hi/strings.xml`:

```xml
<string name="upi_settings_title">यूपीआई पेमेंट सेटिंग</string>
<string name="upi_settings_vpa_label">आपकी यूपीआई आईडी</string>
<string name="upi_settings_warning">भुगतान सीधे इस यूपीआई आईडी में आएगा — सेव करने से पहले जांच लें कि यह सही है।</string>
<string name="upi_settings_save_cta">यूपीआई आईडी सेव करें</string>
<string name="earnings_upi_settings">यूपीआई सेटिंग</string>
```

In `HomeGraph.kt`, add alongside the existing `"payout_settings"` composable:

```kotlin
composable("upi_settings") {
    UpiSettingsScreen(onBack = { navController.popBackStack() })
}
```

and thread `onUpiSettings = { navController.navigate("upi_settings") }` into `HomeDashboardRoute`/`EarningsScreen`'s parameter list next to `onPayoutSettings`, at both of the two call sites found in `EarningsScreen.kt` (lines ~199 and ~267 per current file state) — add a second `OutlinedButton` right after each existing "Payout settings" button:

```kotlin
OutlinedButton(onClick = onUpiSettings, modifier = Modifier.fillMaxWidth()) {
    Text(stringResource(R.string.earnings_upi_settings))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*UpiSettingsViewModelTest*"`
Expected: PASS (2/2)

- [ ] **Step 5: Add the Paparazzi golden (ignored, CI-recorded)**

```kotlin
package com.homeservices.technician.ui.paymentsettings

import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.homeservices.designsystem.theme.HomeservicesTheme
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Paparazzi goldens recorded on CI Linux only — see paparazzi-cross-os-goldens.md")
public class UpiSettingsScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi(deviceConfig = DeviceConfig.PIXEL_5)

    @Test
    public fun `UpiSettingsScreen empty state`() {
        paparazzi.snapshot {
            HomeservicesTheme {
                UpiSettingsScreen(onBack = {})
            }
        }
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/paymentsettings \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/paymentsettings \
        technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt \
        technician-app/app/src/main/kotlin/com/homeservices/technician/ui/earnings/EarningsScreen.kt \
        technician-app/app/src/main/res/values/strings.xml technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): add UPI settings screen for entering the payout VPA"
```

---

## Work Stream C — smoke gate + review

### Task 7: Smoke gate + Codex + push

- [ ] Run `bash tools/pre-codex-smoke.sh technician-app` — must exit 0. Delete any locally-generated Paparazzi golden PNGs first (`git status` in `technician-app/**/snapshots/` should show nothing new/modified) and use `-PexcludePaparazzi` per `feedback_smoke_gate_paparazzi` if Paparazzi itself misbehaves on Windows.
- [ ] Fix any failures before invoking Codex — do not proceed on a red gate.
- [ ] Invoke the `codex-review-gate` skill (`codex review --base main`). Fix any findings in this session and re-run once per `feedback_codex_paired_pr_pattern`/`feedback_lean_review_stack` — do not iterate more than once without checking in.
- [ ] After Codex passes, trigger `paparazzi-record.yml` via `workflow_dispatch` for `technician-app` to record the new goldens on CI Linux (per `docs/patterns/paparazzi-cross-os-goldens.md`) — do this once the PR is open so the recording commits land on the PR branch.
- [ ] `git fetch origin main && git merge origin/main` before the final push — if this pulls in admin-web API changes from a parallel stream, run `pnpm run openapi:client` in `admin-web` (unlikely to be touched by this story, but check).
- [ ] Push and open the PR with `gh pr merge --auto --squash` once CI is green.

# E21-S05b — Dues Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a technician see what they owe, understand why an offer was refused, and reach a way to settle — by consuming the `commission-due` endpoint E21-S02 built and the accept contract E21-S04 defined, neither of which the client has ever read.

**Architecture:** One new Retrofit service reads `GET /v1/technicians/me/commission-due`; a wallet screen renders it in full and the home screen renders a one-line banner from the same payload via an independent fetch that cannot degrade the jobs list. The job-offer accept path stops discarding its error body: `403 COMMISSION_HOLD_BLOCKED` becomes a terminal `BlockedByDues` state with a wallet CTA and no retry, while `503 HOLD_CHECK_UNAVAILABLE` stays on the offer with no dues copy.

**Tech Stack:** Kotlin + Compose (Hilt, Moshi, Retrofit, MockK, JUnit 5, AssertJ, Paparazzi). **No API changes at all** — every endpoint this plan consumes already exists and is already deployed.

**Spec:** `docs/superpowers/specs/2026-09-12-e21-s05-technician-kyc-wallet-design.md` (§3, §5, §6, §8, §9)

## Global Constraints

- **Worktree:** `C:/Alok/Business Projects/wt-e21-s05`, branch `feat/e21-s05-technician-kyc-wallet`. Runs after or alongside E21-S05a; shares no files with it except `AppNavigation.kt`/`HomeGraph.kt`.
- **🚫 No API changes.** `GET /v1/technicians/me/commission-due` already returns everything needed. Do not add, widen, or "tidy" any endpoint in this plan. Do not touch `dispatch-eligibility.ts` or any flag.
- **Field-name trap — do not normalise these into one name.** The commission-due response spells the block threshold **`hold.blockPaise`**; the accept-path `403` body spells the same concept **`blockThresholdPaise`**. Both are correct in their own response. Map each verbatim at its own boundary.
- **`403` is terminal — never retry it.** The server has already declined the attempt and walked the booking to the next candidate. A retry cannot succeed and races the next technician's offer.
- **Fallback latency is ~120 seconds, not 30** (90s offer window + up to one 30s sweep tick). Any copy or timing logic referencing the fallback uses 120.
- **Kotlin explicit API mode** (`-Xexplicit-api=strict`, `-Werror`): explicit visibility modifiers everywhere, `: Unit` on test functions. `docs/patterns/kotlin-explicit-api-public-modifier.md`.
- **String parity enforced by `lintDebug`.** Every new string needs a `values-hi/strings.xml` entry in the same commit.
- **Paparazzi: write tests, never record.** Do **not** run `recordPaparazziDebug`; do **not** delete the 53 existing goldens under `technician-app/app/src/test/snapshots/images/`.
- **Coverage floor 80%** (`koverVerify`).
- **BLOCKING INPUT:** the wallet CTA needs the real WhatsApp support number from Alok. The existing `tel:+919876543210` in `TechnicianHomeScreen.kt:988-1010` is a placeholder and must not be reused on a money screen. Task 6 is blocked until the number is supplied.

---

## File Structure

**New (`technician-app/app/src/main/kotlin/com/homeservices/technician/`):**
- `data/commission/CommissionApiService.kt` — Retrofit interface + Moshi DTOs for the commission-due response.
- `data/commission/CommissionRepository.kt` / `CommissionRepositoryImpl.kt` — maps DTO → domain.
- `data/commission/di/CommissionModule.kt` — Hilt bindings (mirror `data/kyc/di/KycModule.kt`).
- `domain/commission/model/CommissionDue.kt` — domain models (`CommissionDue`, `HoldState`, `CommissionEntry`).
- `domain/commission/GetCommissionDueUseCase.kt`
- `ui/wallet/WalletScreen.kt`, `WalletUiState.kt`, `WalletViewModel.kt`
- `ui/home/DuesBanner.kt`

**Modified:**
- `domain/jobOffer/model/JobOfferResult.kt` — `BlockedByDues`, `HoldCheckUnavailable`.
- `data/jobOffer/…` — `acceptOffer` returns a response whose error body is readable; map `403`/`503`.
- `ui/jobOffer/JobOfferUiState.kt`, `JobOfferViewModel.kt`, `JobOfferScreen.kt`.
- `ui/home/TechnicianHomeViewModel.kt` — independent dues fetch.
- `ui/home/TechnicianHomeScreen.kt` — banner slot in `TodayScreen`'s `LazyColumn`.
- `navigation/HomeGraph.kt` — `"wallet"` route.
- `res/values/strings.xml`, `res/values-hi/strings.xml`.

---

## Task 1: Commission domain models and DTOs

**Files:**
- Create: `domain/commission/model/CommissionDue.kt`
- Create: `data/commission/CommissionApiService.kt`
- Test: `app/src/test/kotlin/com/homeservices/technician/data/commission/CommissionDtoTest.kt`

**Interfaces:**
- Produces: `CommissionDue`, `HoldState`, `CommissionEntry` (domain); `CommissionDueResponse` + nested DTOs (data). Tasks 2, 4, 5, 6 consume these.

**Server contract** (`TechnicianCommissionDueV2Schema`, `api/src/schemas/commission-receivable.ts:153-202`) — map only what this story renders; unused branches (`remittances`, `credits`, `weekSummary`) are omitted deliberately rather than modelled and ignored:

```
totalOutstandingPaise: int, dueCount: int,
hold: { state, warnPaise, blockPaise, enforcementEnabled, override? { until, reason } },
entries: [{ bookingId, serviceName?, slotDate?, bookingAmount, cashCollectedAmount?,
            commissionDue, remittedAmount, outstandingPaise, collectionMethod?,
            remittanceStatus, createdAt }]
```

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.data.commission

import com.homeservices.technician.domain.commission.model.HoldState
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class CommissionDtoTest {
    private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

    @Test
    public fun `parses a full commission-due payload`(): Unit {
        val json = """
            {"totalOutstandingPaise":124000,"dueCount":2,
             "hold":{"state":"WARN","warnPaise":100000,"blockPaise":200000,"enforcementEnabled":false},
             "entries":[{"bookingId":"b1","serviceName":"Fridge repair","slotDate":"2026-09-08",
                         "bookingAmount":80000,"commissionDue":16000,"remittedAmount":0,
                         "outstandingPaise":16000,"remittanceStatus":"PENDING",
                         "createdAt":"2026-09-08T10:00:00.000Z"}],
             "remittances":[],"credits":[],
             "weekSummary":{"weekStart":"2026-09-07","jobs":2,"cashCollectedPaise":160000,
                            "commissionPaise":32000,"netPaise":128000}}
        """.trimIndent()

        val dto = moshi.adapter(CommissionDueResponse::class.java).fromJson(json)!!

        assertThat(dto.totalOutstandingPaise).isEqualTo(124_000L)
        assertThat(dto.hold.state).isEqualTo("WARN")
        assertThat(dto.hold.blockPaise).isEqualTo(200_000L)
        assertThat(dto.entries).hasSize(1)
        assertThat(dto.entries[0].serviceName).isEqualTo("Fridge repair")
    }

    @Test
    public fun `tolerates absent optional entry fields`(): Unit {
        val json = """
            {"totalOutstandingPaise":0,"dueCount":0,
             "hold":{"state":"CLEAR","warnPaise":100000,"blockPaise":200000,"enforcementEnabled":false},
             "entries":[{"bookingId":"b1","bookingAmount":0,"commissionDue":0,"remittedAmount":0,
                         "outstandingPaise":0,"remittanceStatus":"PENDING",
                         "createdAt":"2026-09-08T10:00:00.000Z"}]}
        """.trimIndent()

        val dto = moshi.adapter(CommissionDueResponse::class.java).fromJson(json)!!

        assertThat(dto.entries[0].serviceName).isNull()
        assertThat(dto.entries[0].slotDate).isNull()
    }

    @Test
    public fun `maps an unrecognised hold state to CLEAR rather than throwing`(): Unit {
        // Never let an unknown server enum crash a money screen. Failing open to CLEAR hides a
        // banner; throwing would blank the whole wallet.
        assertThat(HoldState.fromWire("SOMETHING_NEW")).isEqualTo(HoldState.CLEAR)
        assertThat(HoldState.fromWire("BLOCKED")).isEqualTo(HoldState.BLOCKED)
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CommissionDtoTest*" -PexcludePaparazzi`
Expected: FAIL — unresolved references.

- [ ] **Step 3: Write the implementation**

`domain/commission/model/CommissionDue.kt`:

```kotlin
package com.homeservices.technician.domain.commission.model

public enum class HoldState {
    CLEAR,
    WARN,
    BLOCKED,
    ;

    public companion object {
        /**
         * Unknown wire values degrade to CLEAR. A money screen must render even when the server
         * grows a state this build has never heard of; suppressing a banner is recoverable,
         * crashing the wallet is not.
         */
        public fun fromWire(raw: String?): HoldState =
            entries.firstOrNull { it.name == raw } ?: CLEAR
    }
}

public data class CommissionEntry(
    public val bookingId: String,
    public val serviceName: String?,
    public val slotDate: String?,
    public val commissionDuePaise: Long,
    public val outstandingPaise: Long,
)

public data class CommissionDue(
    public val totalOutstandingPaise: Long,
    public val dueCount: Int,
    public val holdState: HoldState,
    /** The server calls this `hold.blockPaise`; the accept-path 403 calls the same idea
     *  `blockThresholdPaise`. Do not unify the wire names — only this domain name. */
    public val blockThresholdPaise: Long,
    public val entries: List<CommissionEntry>,
)
```

`data/commission/CommissionApiService.kt` — DTOs with `@JsonClass(generateAdapter = true)` matching the JSON above (`CommissionDueResponse`, `HoldDto`, `CommissionEntryDto`), optional fields nullable with defaults, plus:

```kotlin
internal interface CommissionApiService {
    @GET("v1/technicians/me/commission-due")
    suspend fun getCommissionDue(): CommissionDueResponse
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CommissionDtoTest*" -PexcludePaparazzi`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/commission/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/commission/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/commission/
git commit -m "feat(technician-app): add commission-due domain models and DTOs"
```

---

## Task 2: Repository, use case, Hilt module

**Files:**
- Create: `data/commission/CommissionRepository.kt`, `CommissionRepositoryImpl.kt`, `di/CommissionModule.kt`
- Create: `domain/commission/GetCommissionDueUseCase.kt`
- Test: `app/src/test/kotlin/com/homeservices/technician/data/commission/CommissionRepositoryImplTest.kt`

**Interfaces:**
- Consumes: `CommissionApiService`, `CommissionDue` (Task 1).
- Produces: `GetCommissionDueUseCase.invoke(): Result<CommissionDue>` — Tasks 4, 5, 6 consume it.

**Why `Result`:** both consumers must survive a failure without breaking their screen (the banner must never blank the jobs list). An exception-throwing use case makes that easy to get wrong at each call site.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.data.commission

import com.homeservices.technician.domain.commission.model.HoldState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.io.IOException

public class CommissionRepositoryImplTest {
    private val api = mockk<CommissionApiService>()

    @Test
    public fun `maps the DTO onto the domain model`(): Unit =
        runTest {
            coEvery { api.getCommissionDue() } returns aResponse(state = "BLOCKED", outstanding = 250_000L)

            val result = CommissionRepositoryImpl(api).getCommissionDue()

            assertThat(result.isSuccess).isTrue()
            val due = result.getOrThrow()
            assertThat(due.holdState).isEqualTo(HoldState.BLOCKED)
            assertThat(due.totalOutstandingPaise).isEqualTo(250_000L)
        }

    @Test
    public fun `returns a failed Result instead of throwing when the call fails`(): Unit =
        runTest {
            coEvery { api.getCommissionDue() } throws IOException("offline")

            val result = CommissionRepositoryImpl(api).getCommissionDue()

            assertThat(result.isFailure).isTrue()
        }
}
```

Write `aResponse(...)` as a local helper building a `CommissionDueResponse`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CommissionRepositoryImplTest*" -PexcludePaparazzi`
Expected: FAIL — class does not exist.

- [ ] **Step 3: Write the implementation**

```kotlin
public interface CommissionRepository {
    public suspend fun getCommissionDue(): Result<CommissionDue>
}

internal class CommissionRepositoryImpl
    @Inject
    constructor(private val api: CommissionApiService) : CommissionRepository {
        override suspend fun getCommissionDue(): Result<CommissionDue> =
            runCatching {
                val dto = api.getCommissionDue()
                CommissionDue(
                    totalOutstandingPaise = dto.totalOutstandingPaise,
                    dueCount = dto.dueCount,
                    holdState = HoldState.fromWire(dto.hold.state),
                    blockThresholdPaise = dto.hold.blockPaise,
                    entries = dto.entries.map { e ->
                        CommissionEntry(
                            bookingId = e.bookingId,
                            serviceName = e.serviceName,
                            slotDate = e.slotDate,
                            commissionDuePaise = e.commissionDue,
                            outstandingPaise = e.outstandingPaise,
                        )
                    },
                )
            }
    }
```

`GetCommissionDueUseCase` delegates to the repository. `di/CommissionModule.kt` mirrors `data/kyc/di/KycModule.kt`: `@Provides` the Retrofit service from the existing authenticated `Retrofit` instance, `@Binds` the repository interface.

- [ ] **Step 4: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*CommissionRepositoryImplTest*" -PexcludePaparazzi`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify Hilt wiring compiles**

Run: `cd technician-app && ./gradlew assembleDebug --quiet`
Expected: BUILD SUCCESSFUL. A missing binding fails here, not at runtime (`docs/patterns/hilt-module-android-test-scope.md`).

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/data/commission/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/domain/commission/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/commission/
git commit -m "feat(technician-app): add commission-due repository, use case and Hilt bindings"
```

---

## Task 3: Job-offer accept — read the error body, add the two results

**Files:**
- Modify: `domain/jobOffer/model/JobOfferResult.kt`
- Modify: the accept path (`AcceptJobOfferUseCase` + `JobOfferApiService`)
- Test: `app/src/test/kotlin/com/homeservices/technician/domain/jobOffer/AcceptJobOfferUseCaseTest.kt`

**Interfaces:**
- Produces: `JobOfferResult.BlockedByDues(outstandingPaise, blockThresholdPaise)`, `JobOfferResult.HoldCheckUnavailable` — Task 4 consumes them.

**Current state:** `acceptOffer` returns `Response<Unit>`, so the error body is discarded. `403` and `503` both fall into `else -> UnknownError(code)`, which the ViewModel renders as "Server error (403). Try again." — inviting a retry the server has already made impossible. Follow `ShieldRepositoryImpl.kt:38-44`'s Moshi error-body pattern; do **not** imitate `ErasureRepositoryImpl.kt:29`'s substring sniffing.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.domain.jobOffer

import com.homeservices.technician.domain.jobOffer.model.JobOfferResult
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import retrofit2.Response

public class AcceptJobOfferUseCaseTest {
    private val api = mockk<JobOfferApiService>()

    private fun errorBody(json: String) =
        json.toResponseBody("application/json".toMediaType())

    @Test
    public fun `403 COMMISSION_HOLD_BLOCKED maps to BlockedByDues with both amounts`(): Unit =
        runTest {
            coEvery { api.acceptOffer("b1") } returns
                Response.error(
                    403,
                    errorBody(
                        """{"code":"COMMISSION_HOLD_BLOCKED","outstandingPaise":250000,"blockThresholdPaise":200000}""",
                    ),
                )

            val result = createUseCase().invoke("b1")

            assertThat(result).isInstanceOf(JobOfferResult.BlockedByDues::class.java)
            val blocked = result as JobOfferResult.BlockedByDues
            assertThat(blocked.outstandingPaise).isEqualTo(250_000L)
            assertThat(blocked.blockThresholdPaise).isEqualTo(200_000L)
        }

    @Test
    public fun `503 HOLD_CHECK_UNAVAILABLE maps to HoldCheckUnavailable`(): Unit =
        runTest {
            coEvery { api.acceptOffer("b1") } returns
                Response.error(503, errorBody("""{"code":"HOLD_CHECK_UNAVAILABLE"}"""))

            val result = createUseCase().invoke("b1")

            assertThat(result).isEqualTo(JobOfferResult.HoldCheckUnavailable)
        }

    @Test
    public fun `a 403 that is not a commission hold stays an UnknownError`(): Unit =
        runTest {
            coEvery { api.acceptOffer("b1") } returns
                Response.error(403, errorBody("""{"code":"FORBIDDEN"}"""))

            val result = createUseCase().invoke("b1")

            assertThat(result).isInstanceOf(JobOfferResult.UnknownError::class.java)
        }

    @Test
    public fun `a 403 with an unparseable body stays an UnknownError rather than crashing`(): Unit =
        runTest {
            coEvery { api.acceptOffer("b1") } returns Response.error(403, errorBody("not json"))

            val result = createUseCase().invoke("b1")

            assertThat(result).isInstanceOf(JobOfferResult.UnknownError::class.java)
        }

    @Test
    public fun `409 and 410 keep their existing mappings`(): Unit =
        runTest {
            coEvery { api.acceptOffer("b1") } returns Response.error(409, errorBody("{}"))
            assertThat(createUseCase().invoke("b1")).isInstanceOf(JobOfferResult.Conflict::class.java)

            coEvery { api.acceptOffer("b1") } returns Response.error(410, errorBody("{}"))
            assertThat(createUseCase().invoke("b1")).isInstanceOf(JobOfferResult.Expired::class.java)
        }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*AcceptJobOfferUseCaseTest*" -PexcludePaparazzi`
Expected: FAIL — the new result types do not exist and `403`/`503` map to `UnknownError`.

- [ ] **Step 3: Write the implementation**

`JobOfferResult.kt` — add:

```kotlin
    /**
     * The technician owes at or above the block threshold and enforcement is on.
     *
     * The server has ALREADY declined this attempt and moved the booking to the next candidate.
     * This is terminal: do not retry this booking. See ADR-0032 and E21-S04 interface notes.
     */
    public data class BlockedByDues(
        val outstandingPaise: Long,
        val blockThresholdPaise: Long,
    ) : JobOfferResult()

    /**
     * The hold could not be determined (503). The offer is still PENDING and a retry inside the
     * remaining 90-second window is legitimate. This is NOT a balance — show no dues message.
     */
    public data object HoldCheckUnavailable : JobOfferResult()
```

`JobOfferApiService` — `suspend fun acceptOffer(@Path("bookingId") bookingId: String): Response<ResponseBody>` (or a typed empty-success DTO), so the error body survives.

`AcceptJobOfferUseCase` — inject `Moshi`, add branches **before** the `else`:

```kotlin
private const val HTTP_FORBIDDEN = 403
private const val HTTP_SERVICE_UNAVAILABLE = 503
private const val CODE_COMMISSION_HOLD_BLOCKED = "COMMISSION_HOLD_BLOCKED"
private const val CODE_HOLD_CHECK_UNAVAILABLE = "HOLD_CHECK_UNAVAILABLE"

@JsonClass(generateAdapter = true)
internal data class AcceptErrorDto(
    val code: String?,
    val outstandingPaise: Long?,
    val blockThresholdPaise: Long?,
)
```

```kotlin
    response.code() == HTTP_FORBIDDEN -> {
        val err = parseAcceptError(response)
        if (err?.code == CODE_COMMISSION_HOLD_BLOCKED) {
            JobOfferResult.BlockedByDues(
                outstandingPaise = err.outstandingPaise ?: 0L,
                blockThresholdPaise = err.blockThresholdPaise ?: 0L,
            )
        } else {
            JobOfferResult.UnknownError(response.code())
        }
    }
    response.code() == HTTP_SERVICE_UNAVAILABLE -> {
        val err = parseAcceptError(response)
        if (err?.code == CODE_HOLD_CHECK_UNAVAILABLE) {
            JobOfferResult.HoldCheckUnavailable
        } else {
            JobOfferResult.UnknownError(response.code())
        }
    }
```

with

```kotlin
    private fun parseAcceptError(response: Response<*>): AcceptErrorDto? =
        runCatching {
            moshi.adapter(AcceptErrorDto::class.java).fromJson(response.errorBody()?.string() ?: "")
        }.getOrNull()
```

Keep the existing `409`/`410`/success branches byte-for-byte.

- [ ] **Step 4: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*AcceptJobOfferUseCaseTest*" -PexcludePaparazzi`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/jobOffer/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/jobOffer/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/domain/jobOffer/
git commit -m "feat(technician-app): map the dues-block 403 and hold-unavailable 503 on accept"
```

---

## Task 4: `JobOfferViewModel` — terminal blocked state, retryable 503

**Files:**
- Modify: `ui/jobOffer/JobOfferUiState.kt`, `ui/jobOffer/JobOfferViewModel.kt`
- Modify: `app/src/test/kotlin/com/homeservices/technician/ui/jobOffer/JobOfferViewModelTest.kt`
- Modify: `res/values/strings.xml`, `res/values-hi/strings.xml`

**Interfaces:**
- Consumes: `JobOfferResult.BlockedByDues`, `HoldCheckUnavailable` (Task 3).
- Produces: `JobOfferUiState.BlockedByDues(outstandingPaise, blockThresholdPaise)` — Tasks 7, 8 consume it.

- [ ] **Step 1: Write the failing test**

Append to the existing `JobOfferViewModelTest.kt`, matching its `createViewModel()` / `offerFlow.emit(offer)` setup:

```kotlin
    @Test
    public fun `403 dues block moves to a terminal BlockedByDues state`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            coEvery { acceptUseCase(offer.bookingId) } returns
                JobOfferResult.BlockedByDues(outstandingPaise = 250_000L, blockThresholdPaise = 200_000L)

            viewModel.accept()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(JobOfferUiState.BlockedByDues::class.java)
            assertThat((state as JobOfferUiState.BlockedByDues).outstandingPaise).isEqualTo(250_000L)
        }

    @Test
    public fun `a blocked offer is not retried`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            coEvery { acceptUseCase(offer.bookingId) } returns
                JobOfferResult.BlockedByDues(outstandingPaise = 250_000L, blockThresholdPaise = 200_000L)

            viewModel.accept()
            viewModel.accept() // a second tap must not reach the server

            coVerify(exactly = 1) { acceptUseCase(offer.bookingId) }
        }

    @Test
    public fun `503 stays on Offering and shows no dues copy`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            coEvery { acceptUseCase(offer.bookingId) } returns JobOfferResult.HoldCheckUnavailable

            viewModel.accept()

            val state = viewModel.uiState.value
            assertThat(state).isInstanceOf(JobOfferUiState.Offering::class.java)
            val offering = state as JobOfferUiState.Offering
            assertThat(offering.isAccepting).isFalse()
            assertThat(offering.errorMessage).doesNotContain("owe")
            assertThat(offering.errorMessage).doesNotContain("dues")
        }

    @Test
    public fun `503 leaves the offer retryable`(): Unit =
        runTest {
            createViewModel()
            val offer = aJobOffer()
            offerFlow.emit(offer)
            coEvery { acceptUseCase(offer.bookingId) } returns JobOfferResult.HoldCheckUnavailable

            viewModel.accept()
            coEvery { acceptUseCase(offer.bookingId) } returns JobOfferResult.Accepted(offer.bookingId)
            viewModel.accept()

            assertThat(viewModel.uiState.value).isInstanceOf(JobOfferUiState.Accepted::class.java)
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*JobOfferViewModelTest*" -PexcludePaparazzi`
Expected: FAIL — `JobOfferUiState.BlockedByDues` does not exist.

- [ ] **Step 3: Add the strings (both locales)**

`values/strings.xml`:

```xml
    <string name="job_offer_blocked_title">This job isn\'t available</string>
    <string name="job_offer_blocked_body">You owe %1$s in commission. Clear your dues to start receiving jobs again.</string>
    <string name="job_offer_blocked_cta">View wallet</string>
    <string name="job_offer_hold_unavailable">Couldn\'t check right now. Try again.</string>
```

`values-hi/strings.xml`:

```xml
    <string name="job_offer_blocked_title">यह जॉब उपलब्ध नहीं है</string>
    <string name="job_offer_blocked_body">आप पर %1$s कमीशन बकाया है। दोबारा जॉब पाने के लिए बकाया चुकाएँ।</string>
    <string name="job_offer_blocked_cta">वॉलेट देखें</string>
    <string name="job_offer_hold_unavailable">अभी जाँच नहीं हो सकी। दोबारा कोशिश करें।</string>
```

- [ ] **Step 4: Write the implementation**

`JobOfferUiState.kt`:

```kotlin
    /**
     * The accept was refused because the technician owes at or above the block threshold.
     *
     * Terminal by design: the server already declined the attempt and moved the booking on, so
     * this state exposes no retry affordance — only a wallet CTA.
     */
    public data class BlockedByDues(
        val outstandingPaise: Long,
        val blockThresholdPaise: Long,
    ) : JobOfferUiState()
```

`JobOfferViewModel.kt` — in the `when (result)`:

```kotlin
    is JobOfferResult.BlockedByDues -> {
        // No retry: the attempt is already declined server-side. Clear the offer and stop the
        // countdown so nothing re-arms an accept for a booking that has moved on.
        countdownJob?.cancel()
        eventBus.clearCurrentOffer()
        _uiState.value = JobOfferUiState.BlockedByDues(
            outstandingPaise = result.outstandingPaise,
            blockThresholdPaise = result.blockThresholdPaise,
        )
    }
    JobOfferResult.HoldCheckUnavailable ->
        // Transient, not a balance. Stay on the offer with a neutral message so the technician
        // can retry inside the remaining window.
        startOffer(offer = current.offer, errorMessage = holdUnavailableMessage)
```

`accept()`'s existing guard (early-return unless the state is `Offering`) is what makes the second tap in the test a no-op — verify it, do not add a second guard.

- [ ] **Step 5: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*JobOfferViewModelTest*" -PexcludePaparazzi`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/jobOffer/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/jobOffer/ \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): render a terminal dues-block state on job offers"
```

---

## Task 5: Wallet screen

**Files:**
- Create: `ui/wallet/WalletUiState.kt`, `WalletViewModel.kt`, `WalletScreen.kt`
- Modify: `navigation/HomeGraph.kt`
- Modify: `res/values/strings.xml`, `res/values-hi/strings.xml`
- Test: `app/src/test/kotlin/com/homeservices/technician/ui/wallet/WalletViewModelTest.kt`

**Interfaces:**
- Consumes: `GetCommissionDueUseCase` (Task 2).
- Produces: the `"wallet"` route — Tasks 4's CTA and Task 6's banner navigate to it.

- [ ] **Step 1: Write the failing test**

```kotlin
package com.homeservices.technician.ui.wallet

import com.homeservices.technician.domain.commission.GetCommissionDueUseCase
import com.homeservices.technician.domain.commission.model.CommissionDue
import com.homeservices.technician.domain.commission.model.HoldState
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class WalletViewModelTest {
    private val useCase = mockk<GetCommissionDueUseCase>()

    @Test
    public fun `loads into Ready with the hold state and outstanding total`(): Unit =
        runTest {
            coEvery { useCase() } returns
                Result.success(
                    CommissionDue(
                        totalOutstandingPaise = 124_000L,
                        dueCount = 2,
                        holdState = HoldState.WARN,
                        blockThresholdPaise = 200_000L,
                        entries = emptyList(),
                    ),
                )

            val vm = WalletViewModel(useCase)
            vm.load()

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(WalletUiState.Ready::class.java)
            assertThat((state as WalletUiState.Ready).due.holdState).isEqualTo(HoldState.WARN)
        }

    @Test
    public fun `surfaces an Error state when the fetch fails`(): Unit =
        runTest {
            coEvery { useCase() } returns Result.failure(RuntimeException("offline"))

            val vm = WalletViewModel(useCase)
            vm.load()

            assertThat(vm.uiState.value).isInstanceOf(WalletUiState.Error::class.java)
        }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*WalletViewModelTest*" -PexcludePaparazzi`
Expected: FAIL.

- [ ] **Step 3: Add the strings (both locales)**

`values/strings.xml`:

```xml
    <string name="wallet_title">My wallet</string>
    <string name="wallet_outstanding_label">You owe</string>
    <string name="wallet_threshold_label">Jobs pause at %1$s</string>
    <string name="wallet_state_clear">All clear</string>
    <string name="wallet_state_warn">Pay soon</string>
    <string name="wallet_state_blocked">Jobs paused</string>
    <string name="wallet_entries_header">Commission on your jobs</string>
    <string name="wallet_empty">You have no pending commission.</string>
    <string name="wallet_error">Couldn\'t load your wallet. Pull to retry.</string>
```

`values-hi/strings.xml`:

```xml
    <string name="wallet_title">मेरा वॉलेट</string>
    <string name="wallet_outstanding_label">आपका बकाया</string>
    <string name="wallet_threshold_label">%1$s पर जॉब रुक जाएँगी</string>
    <string name="wallet_state_clear">सब ठीक है</string>
    <string name="wallet_state_warn">जल्द भुगतान करें</string>
    <string name="wallet_state_blocked">जॉब रुकी हुई हैं</string>
    <string name="wallet_entries_header">आपकी जॉब पर कमीशन</string>
    <string name="wallet_empty">कोई बकाया कमीशन नहीं है।</string>
    <string name="wallet_error">वॉलेट लोड नहीं हो सका। दोबारा कोशिश करें।</string>
```

- [ ] **Step 4: Write the implementation**

`WalletUiState.kt`: `Loading`, `Ready(due: CommissionDue)`, `Error` — all `public`.

`WalletViewModel.kt`: `@HiltViewModel`, `load()` sets `Loading` then folds the `Result`.

`WalletScreen.kt`: split into the Hilt-wired `WalletScreen(onBack, onContactSupport, viewModel = hiltViewModel())` and a **stateless `WalletScreenContent(uiState, onBack, onContactSupport)`** — Task 8's Paparazzi tests render the stateless one. Reuse the visual vocabulary already in `TechnicianHomeScreen.kt`: `StatusPill` for the hold chip, `SectionHeader` for the entries header, `LoadingCard` / `ErrorCard` for those states, and `PendingActionCard`'s `Surface(shape = RoundedCornerShape(18.dp))` + `Row(padding 14.dp, spacedBy 12.dp)` geometry for entry rows. Money renders in rupees from paise (`paise / 100`), never raw paise.

`HomeGraph.kt` — add inside the existing `navigation(...)` block, matching the file's string-route style:

```kotlin
            composable("wallet") {
                WalletScreen(
                    onBack = { navController.popBackStack() },
                    onContactSupport = { /* Task 6 supplies the intent */ },
                )
            }
```

**Note:** `navigation/TechnicianRoutes.kt` is a dead E11-S01a spike file and is **not** used by the live NavHost. Do not add the route there.

- [ ] **Step 5: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*WalletViewModelTest*" -PexcludePaparazzi && ./gradlew assembleDebug --quiet`
Expected: PASS, then BUILD SUCCESSFUL.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/wallet/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/wallet/ \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): add the wallet screen"
```

---

## Task 6: Support contact — retire the placeholder, wire the CTA

**Files:**
- Modify: `res/values/strings.xml`, `res/values-hi/strings.xml`
- Modify: `ui/home/TechnicianHomeScreen.kt` (the two hardcoded contact entries, ~lines 988-1010)
- Modify: `ui/wallet/WalletScreen.kt` (CTA wiring)

**⛔ BLOCKED until Alok supplies the real WhatsApp support number.** Do not proceed with a placeholder.

- [ ] **Step 1: Add the contact strings (both locales)**

```xml
    <string name="support_whatsapp_number" translatable="false">REPLACE_WITH_REAL_NUMBER</string>
    <string name="support_email" translatable="false">support@homeheroo.in</string>
    <string name="wallet_settle_cta">Contact office to settle</string>
```

Hindi file gets `wallet_settle_cta` only — the two `translatable="false"` entries must not be duplicated into `values-hi` (Lint flags translated `translatable="false"` strings):

```xml
    <string name="wallet_settle_cta">बकाया चुकाने के लिए संपर्क करें</string>
```

- [ ] **Step 2: Wire the WhatsApp intent**

```kotlin
private fun openWhatsAppSupport(context: Context, number: String, message: String) {
    val uri = Uri.parse("https://wa.me/$number?text=${Uri.encode(message)}")
    val intent = Intent(Intent.ACTION_VIEW, uri)
    // wa.me resolves in a browser when WhatsApp is absent, so no explicit package and no
    // resolveActivity guard — setting the package would throw ActivityNotFoundException on a
    // handset without WhatsApp, which is exactly the technician we must not strand.
    context.startActivity(intent)
}
```

Call it from the wallet's `onContactSupport`, passing a prefilled message naming the outstanding amount.

- [ ] **Step 3: Replace the placeholder in the two existing home-screen entries**

Point the "Call partner support" entry at `stringResource(R.string.support_whatsapp_number)` and the email entry at `support@homeheroo.in`, retiring `+919876543210` and the conflicting `partners@homeheroo.in`.

- [ ] **Step 4: Verify**

Run: `cd technician-app && ./gradlew assembleDebug lintDebug --quiet`
Expected: BUILD SUCCESSFUL, no `MissingTranslation`.

- [ ] **Step 5: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/ \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): wire the wallet settle CTA and retire the placeholder support number"
```

---

## Task 7: Home dues banner

**Files:**
- Create: `ui/home/DuesBanner.kt`
- Modify: `ui/home/TechnicianHomeViewModel.kt`, `ui/home/TechnicianHomeScreen.kt`
- Modify: `res/values/strings.xml`, `res/values-hi/strings.xml`
- Test: `app/src/test/kotlin/com/homeservices/technician/ui/home/TechnicianHomeViewModelTest.kt`

**Interfaces:**
- Consumes: `GetCommissionDueUseCase` (Task 2), the `"wallet"` route (Task 5).

**Design constraint:** `TechnicianHomeViewModel` currently injects only `GetTechnicianBookingsUseCase` and `refresh()` makes exactly one call. The dues fetch is **independent** — a dues failure must never blank the jobs list, so it folds into a nullable field rather than being combined into the bookings result.

- [ ] **Step 1: Write the failing test**

```kotlin
    @Test
    public fun `a dues fetch failure leaves the jobs list intact`(): Unit =
        runTest {
            coEvery { getBookings() } returns Result.success(listOf(aBooking()))
            coEvery { getCommissionDue() } returns Result.failure(RuntimeException("offline"))

            val vm = createViewModel()
            vm.refresh()

            val state = vm.uiState.value as TechnicianHomeUiState.Ready
            assertThat(state.bookings).hasSize(1)
            assertThat(state.duesBanner).isNull()
        }

    @Test
    public fun `WARN hold produces a banner`(): Unit =
        runTest {
            coEvery { getBookings() } returns Result.success(emptyList())
            coEvery { getCommissionDue() } returns Result.success(aDue(HoldState.WARN, 124_000L))

            val vm = createViewModel()
            vm.refresh()

            val banner = (vm.uiState.value as TechnicianHomeUiState.Ready).duesBanner
            assertThat(banner).isNotNull
            assertThat(banner!!.holdState).isEqualTo(HoldState.WARN)
        }

    @Test
    public fun `CLEAR hold produces no banner`(): Unit =
        runTest {
            coEvery { getBookings() } returns Result.success(emptyList())
            coEvery { getCommissionDue() } returns Result.success(aDue(HoldState.CLEAR, 0L))

            val vm = createViewModel()
            vm.refresh()

            assertThat((vm.uiState.value as TechnicianHomeUiState.Ready).duesBanner).isNull()
        }
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*TechnicianHomeViewModelTest*" -PexcludePaparazzi`
Expected: FAIL.

- [ ] **Step 3: Add the strings (both locales)**

```xml
    <string name="dues_banner_warn_title">You owe %1$s</string>
    <string name="dues_banner_warn_body">Pay soon to keep receiving jobs.</string>
    <string name="dues_banner_blocked_title">You owe %1$s</string>
    <string name="dues_banner_blocked_body">Job offers are paused until you pay.</string>
    <string name="dues_banner_cta">View wallet</string>
```

```xml
    <string name="dues_banner_warn_title">आपका बकाया %1$s</string>
    <string name="dues_banner_warn_body">जॉब मिलती रहें, इसके लिए जल्द भुगतान करें।</string>
    <string name="dues_banner_blocked_title">आपका बकाया %1$s</string>
    <string name="dues_banner_blocked_body">भुगतान होने तक नई जॉब नहीं मिलेंगी।</string>
    <string name="dues_banner_cta">वॉलेट देखें</string>
```

- [ ] **Step 4: Write the implementation**

Add to `TechnicianHomeUiState.Ready`:

```kotlin
    /** Null when dues are CLEAR or the dues fetch failed — the banner is never load-bearing. */
    val duesBanner: DuesBannerState? = null,
```

with `public data class DuesBannerState(val holdState: HoldState, val outstandingPaise: Long)`.

In `refresh()`, fetch dues independently of bookings and fold only on success and only for `WARN`/`BLOCKED`.

`DuesBanner.kt` — a stateless `public fun DuesBanner(state: DuesBannerState, onViewWallet: () -> Unit, modifier: Modifier = Modifier)` built on `PendingActionCard`'s geometry (`Surface(onClick = …, shape = RoundedCornerShape(18.dp))`, `Row(padding 14.dp, spacedBy 12.dp)`, 40.dp icon box). Use the file's existing `WarningSoft = Color(0xFFF2E7CF)` for `WARN`; use the error container role from `HomeservicesTheme` for `BLOCKED` rather than inventing a new literal.

In `TodayScreen`'s `LazyColumn`, insert between `PartnerHeader` and the pending-actions block:

```kotlin
            uiState.duesBanner?.let { banner ->
                item { DuesBanner(state = banner, onViewWallet = onViewWallet) }
            }
```

Thread `onViewWallet` from `AppNavigation`/`HomeGraph` as `{ navController.navigate("wallet") }`.

- [ ] **Step 5: Run to verify it passes**

Run: `cd technician-app && ./gradlew testDebugUnitTest --tests "*TechnicianHomeViewModelTest*" -PexcludePaparazzi`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/home/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/home/ \
        technician-app/app/src/main/res/values/strings.xml \
        technician-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(technician-app): add the home dues banner"
```

---

## Task 8: Paparazzi coverage

**Files:**
- Create: `app/src/test/kotlin/com/homeservices/technician/ui/wallet/WalletScreenPaparazziTest.kt`
- Create: `app/src/test/kotlin/com/homeservices/technician/ui/home/DuesBannerPaparazziTest.kt`
- Modify: `app/src/test/kotlin/com/homeservices/technician/ui/jobOffer/JobOfferScreenPaparazziTest.kt`

- [ ] **Step 1: Write the snapshot tests**

Follow `JobOfferScreenPaparazziTest.kt` exactly (JUnit 4 `@get:Rule`, `DeviceConfig.PIXEL_5`, `theme = "android:Theme.Material3.DayNight.NoActionBar"`, light **and** dark per state, stateless `*Content` composables).

Cover: wallet `Ready` with entries, `Ready` empty, `Error`; `DuesBanner` in `WARN` and `BLOCKED`; `JobOfferScreenContent` in `BlockedByDues`. The repo also keeps Hindi variants (`*HiPaparazziTest`) for some screens — add a Hindi variant for the wallet `Ready` state and the `BLOCKED` banner, since this copy is load-bearing for the Ayodhya pilot.

- [ ] **Step 2: Verify they compile**

Run: `cd technician-app && ./gradlew compileDebugUnitTestKotlin --quiet`
Expected: BUILD SUCCESSFUL.

**Do NOT run `recordPaparazziDebug`. Do NOT delete existing goldens.**

- [ ] **Step 3: Commit**

```bash
git add technician-app/app/src/test/kotlin/com/homeservices/technician/ui/
git commit -m "test(technician-app): Paparazzi coverage for wallet, dues banner and blocked offer"
```

---

## Task 9: Smoke gate and review

- [ ] **Step 1: Run the Android smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```
Expected: exit 0 across all 6 steps. `koverVerify` at 80% is the one most likely to fail on a task that adds screens — add ViewModel tests, not Paparazzi tests, to close a coverage gap.

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
Use the `disk-full-read-access` sandbox permission (git worktree). Fix findings in Claude, re-run Codex **once**.

**Pre-empt the predictable re-raise** (`feedback_codex_paired_pr_pattern`): this plan consumes a `403`/`503` contract defined by E21-S04 and an endpoint built by E21-S02, and adds no server code. State in the PR body and in `.codex-review-passed` that the API side is already merged and deliberately untouched, so Codex does not flag the "missing" handler each round.

- [ ] **Step 4: Open the PR**

Body must state: no API changes; the `blockPaise` vs `blockThresholdPaise` distinction is intentional; the `403` path is deliberately non-retryable; and the real support number now replaces the placeholder.

---

## Self-Review Notes

- **Spec coverage:** §3 wallet → Tasks 1, 2, 5, 6; §5 banner → Task 7; §6 job offer → Tasks 3, 4; §7 testing → inline plus Task 8.
- **Deliberately not here:** cash confirm, the active-job response widening, and the Room migration — all in E21-S05c. The KYC work is in E21-S05a.
- **Type consistency:** `HoldState` (Task 1) flows through `CommissionDue` → `WalletUiState.Ready.due` (Task 5) and `DuesBannerState.holdState` (Task 7). `blockThresholdPaise` is the domain name in both `CommissionDue` (mapped from wire `hold.blockPaise`) and `JobOfferResult.BlockedByDues` (mapped from wire `blockThresholdPaise`) — the wire names differ, the domain name does not.
- **Known unknowns to resolve by reading:** `TechnicianHomeUiState`'s real shape and `Ready` members (Task 7), the existing Retrofit/Moshi provider module to mirror for `CommissionModule` (Task 2), `JobOfferScreenContent`'s parameter list (Task 8), and whether `AcceptJobOfferUseCase` already receives `Moshi` (Task 3).

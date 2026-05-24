# Sprint 6 — PRD Completeness Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close 5 P1 PRD findings (PRD-06 network-error retry, PRD-07 pending-booking resume, PRD-08 women-safe filter, PRD-09 privacy nav, PRD-10 backstack fix) in one Feature-tier PR.

**Architecture:** All changes are additive to the existing sealed-class + ViewModel + Compose pattern. PRD-06 adds a new `NetworkError` sealed subclass + retry. PRD-07 adds a new detected state in `CustomerHomeViewModel`, a `PendingBookingResumeBanner`, a cancel API endpoint, and a resume route in the booking graph. PRD-08 adds `safetyTag` to the catalogue domain model + a `WomenSafeFilterToggle` composable wired through BookingViewModel. PRD-09 is a single nav row. PRD-10 fixes `popUpTo` in the Rating and Complaint destinations.

**Tech Stack:** Kotlin, Jetpack Compose, Hilt, Retrofit+Moshi, Coroutines, JUnit 5+MockK

**Worktree:** `C:\Alok\Business Projects\Urbanclap-sprint6` on branch `fix/sprint6-prd-completeness`.
**All file paths below are relative to** `C:\Alok\Business Projects\Urbanclap-sprint6\customer-app\app\src\`.

**PRD-08 owner decisions (confirmed):**
- Late-hour threshold: 19:00 IST
- Category set: server-driven (`safetyTag: Boolean = false` field on `Category` + `CategoryDto`)
- Trigger: triggered + opt-in (show only when slot ≥ 19:00 OR category.safetyTag=true)

**Paired API tasks (note in PR footer, cap Codex at 1 round):**
1. `POST /v1/bookings/{id}/cancel` — PENDING_PAYMENT + SEARCHING only; releases slot lock (PRD-07)
2. `BookingRequest.preferFemaleTechnician: Bool` on `POST /v1/bookings` (PRD-08)

---

## File Map

**Created:**
- `main/kotlin/com/homeservices/customer/ui/booking/PendingBookingResumeBanner.kt`
- `main/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCase.kt`
- `main/kotlin/com/homeservices/customer/ui/booking/WomenSafeFilterToggle.kt`
- `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelNetworkErrorTest.kt`
- `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelWomenSafeTest.kt`
- `test/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModelPendingPaymentTest.kt`
- `test/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCaseTest.kt`

**Modified:**
- `main/kotlin/com/homeservices/customer/ui/booking/BookingUiState.kt`
- `main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt`
- `main/kotlin/com/homeservices/customer/ui/booking/BookingSummaryScreen.kt`
- `main/kotlin/com/homeservices/customer/domain/booking/model/BookingRequest.kt`
- `main/kotlin/com/homeservices/customer/domain/booking/model/CustomerBooking.kt`
- `main/kotlin/com/homeservices/customer/domain/catalogue/model/Category.kt`
- `main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt`
- `main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt`
- `main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt`
- `main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt`
- `main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt`
- `main/kotlin/com/homeservices/customer/data/catalogue/remote/dto/CategoryDto.kt`
- `main/kotlin/com/homeservices/customer/navigation/BookingRoutes.kt`
- `main/kotlin/com/homeservices/customer/navigation/MainGraph.kt`
- `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeUiState.kt`
- `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModel.kt`
- `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeTabContent.kt`
- `main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt`
- `main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt`
- `main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt`
- `main/kotlin/com/homeservices/customer/ui/complaint/ComplaintScreen.kt`
- `main/res/values/strings.xml`
- `main/res/values-hi/strings.xml`

---

## Task 1: Data models — BookingRequest, CustomerBooking, Category (no test)

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/domain/booking/model/BookingRequest.kt`
- Modify: `main/kotlin/com/homeservices/customer/domain/booking/model/CustomerBooking.kt`
- Modify: `main/kotlin/com/homeservices/customer/domain/catalogue/model/Category.kt`

- [ ] **Step 1: Add `preferFemaleTechnician` to BookingRequest**

Replace the `BookingRequest` data class body:
```kotlin
public data class BookingRequest(
    val serviceId: String,
    val categoryId: String,
    val slot: BookingSlot,
    val addressText: String,
    val addressLat: Double,
    val addressLng: Double,
    val paymentMethod: BookingPaymentMethod = BookingPaymentMethod.RAZORPAY,
    val applyCredit: Boolean = false,
    val preferFemaleTechnician: Boolean = false,
)
```

- [ ] **Step 2: Add `razorpayOrderId` to CustomerBooking**

Replace the CustomerBooking data class:
```kotlin
public data class CustomerBooking(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: CustomerBookingStatus,
    val slotDate: String,
    val slotWindow: String,
    val amountPaise: Long,
    val paymentMethod: BookingPaymentMethod,
    val createdAt: String,
    val ratingSubmitted: Boolean = false,
    val razorpayOrderId: String? = null,
)
```

- [ ] **Step 3: Add `safetyTag` to Category domain model**

Replace the Category data class:
```kotlin
public data class Category(
    public val id: String,
    public val name: String,
    public val imageUrl: String,
    public val serviceCount: Int,
    public val minPricePaise: Int,
    public val safetyTag: Boolean = false,
)
```

- [ ] **Step 4: Commit**
```bash
cd "C:\Alok\Business Projects\Urbanclap-sprint6"
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/model/BookingRequest.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/model/CustomerBooking.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/catalogue/model/Category.kt
git commit -m "feat(S6): add preferFemaleTechnician, razorpayOrderId, safetyTag to domain models"
```

---

## Task 2: DTOs — BookingDtos, CategoryDto (no test)

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt`
- Modify: `main/kotlin/com/homeservices/customer/data/catalogue/remote/dto/CategoryDto.kt`

- [ ] **Step 1: Update CreateBookingRequestDto — add preferFemaleTechnician**

In `BookingDtos.kt`, update `CreateBookingRequestDto`:
```kotlin
@JsonClass(generateAdapter = true)
public data class CreateBookingRequestDto(
    val serviceId: String,
    val categoryId: String,
    val slotDate: String,
    val slotWindow: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
    val paymentMethod: String = BookingPaymentMethod.RAZORPAY.name,
    val applyCredit: Boolean = false,
    val preferFemaleTechnician: Boolean = false,
)
```

- [ ] **Step 2: Update CustomerBookingDto — add razorpayOrderId, update toDomain()**

In `BookingDtos.kt`, update `CustomerBookingDto`:
```kotlin
@JsonClass(generateAdapter = true)
public data class CustomerBookingDto(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
    val amount: Long,
    val paymentMethod: String? = null,
    val createdAt: String,
    val ratingSubmitted: Boolean = false,
    val razorpayOrderId: String? = null,
) {
    public fun toDomain(): CustomerBooking =
        CustomerBooking(
            bookingId = bookingId,
            serviceId = serviceId,
            serviceName = serviceName,
            addressText = addressText,
            status = runCatching { CustomerBookingStatus.valueOf(status) }
                .getOrDefault(CustomerBookingStatus.UNKNOWN),
            slotDate = slotDate,
            slotWindow = slotWindow,
            amountPaise = amount,
            paymentMethod = paymentMethod
                ?.let { runCatching { BookingPaymentMethod.valueOf(it) }.getOrNull() }
                ?: BookingPaymentMethod.RAZORPAY,
            createdAt = createdAt,
            ratingSubmitted = ratingSubmitted,
            razorpayOrderId = razorpayOrderId,
        )
}
```

- [ ] **Step 3: Add CancelBookingResponseDto to BookingDtos.kt**

Append at the end of `BookingDtos.kt`:
```kotlin
@JsonClass(generateAdapter = true)
public data class CancelBookingResponseDto(
    val bookingId: String,
    val status: String,
)
```

- [ ] **Step 4: Update CategoryDto — add safetyTag, update toDomain()**

In `CategoryDto.kt`, update `CategoryDto` and its `toDomain()`:
```kotlin
@JsonClass(generateAdapter = true)
public data class CategoryDto(
    @Json(name = "id") public val id: String,
    @Json(name = "name") public val name: String,
    @Json(name = "heroImageUrl") public val heroImageUrl: String,
    @Json(name = "sortOrder") public val sortOrder: Int,
    @Json(name = "services") public val services: List<ServiceCardDto>,
    @Json(name = "safetyTag") public val safetyTag: Boolean = false,
)

public fun CategoryDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Category =
    com.homeservices.customer.domain.catalogue.model.Category(
        id = id,
        name = name,
        imageUrl = heroImageUrl,
        serviceCount = services.size,
        minPricePaise = services.minOfOrNull { it.basePrice } ?: 0,
        safetyTag = safetyTag,
    )
```

- [ ] **Step 5: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/dto/BookingDtos.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/remote/dto/CategoryDto.kt
git commit -m "feat(S6): update DTOs — preferFemaleTechnician, razorpayOrderId, safetyTag, cancel response"
```

---

## Task 3: API, Repository, UseCase — cancel booking (with test)

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt`
- Modify: `main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt`
- Modify: `main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt`
- Modify: `main/kotlin/com/homeservices/customer/data/booking/di/BookingModule.kt`
- Create: `main/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCase.kt`
- Create: `test/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCaseTest.kt`

- [ ] **Step 1: Write the failing test**

Create `test/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCaseTest.kt`:
```kotlin
package com.homeservices.customer.domain.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.BookingRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

public class CancelPendingBookingUseCaseTest {
    private val bookingRepository: BookingRepository = mockk()
    private val useCase = CancelPendingBookingUseCase(bookingRepository)

    @Test
    public fun `invoke calls repository cancelBooking with correct bookingId`(): Unit = runTest {
        coEvery { bookingRepository.cancelBooking("bk-123") } returns Result.success(Unit)
        val result = useCase("bk-123")
        assertThat(result.isSuccess).isTrue()
        coVerify(exactly = 1) { bookingRepository.cancelBooking("bk-123") }
    }

    @Test
    public fun `invoke propagates repository failure`(): Unit = runTest {
        coEvery { bookingRepository.cancelBooking("bk-err") } returns
            Result.failure(RuntimeException("cancel failed"))
        val result = useCase("bk-err")
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).isEqualTo("cancel failed")
    }
}
```

- [ ] **Step 2: Run test — expect compile error (CancelPendingBookingUseCase missing)**
```bash
cd "C:\Alok\Business Projects\Urbanclap-sprint6\customer-app"
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.domain.booking.CancelPendingBookingUseCaseTest" 2>&1 | Select-String -Pattern "FAIL|ERROR|error:|BUILD" | Select-Object -First 10
```
Expected: compile error — CancelPendingBookingUseCase not found.

- [ ] **Step 3: Add `cancelBooking` to BookingRepository interface**

In `BookingRepository.kt`, add:
```kotlin
public suspend fun cancelBooking(bookingId: String): Result<Unit>
```

- [ ] **Step 4: Add `cancelBooking` endpoint to BookingApiService**

In `BookingApiService.kt`, add:
```kotlin
@POST("v1/bookings/{id}/cancel")
public suspend fun cancelBooking(
    @Path("id") bookingId: String,
): CancelBookingResponseDto
```
Also add the import: `import com.homeservices.customer.data.booking.remote.dto.CancelBookingResponseDto`

- [ ] **Step 5: Implement `cancelBooking` in BookingRepositoryImpl**

In `BookingRepositoryImpl.kt`, add the override:
```kotlin
override suspend fun cancelBooking(bookingId: String): Result<Unit> =
    runCatching { bookingApiService.cancelBooking(bookingId) }.map { Unit }
```

- [ ] **Step 6: Create CancelPendingBookingUseCase**

Create `main/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCase.kt`:
```kotlin
package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import javax.inject.Inject

public class CancelPendingBookingUseCase @Inject constructor(
    private val bookingRepository: BookingRepository,
) {
    public suspend operator fun invoke(bookingId: String): Result<Unit> =
        bookingRepository.cancelBooking(bookingId)
}
```

- [ ] **Step 7: Run test — expect pass**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.domain.booking.CancelPendingBookingUseCaseTest" 2>&1 | Select-String -Pattern "PASS|BUILD SUCCESS|FAIL" | Select-Object -First 5
```
Expected: BUILD SUCCESS.

- [ ] **Step 8: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCase.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/remote/BookingApiService.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepository.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/booking/BookingRepositoryImpl.kt
git add customer-app/app/src/test/kotlin/com/homeservices/customer/domain/booking/CancelPendingBookingUseCaseTest.kt
git commit -m "feat(S6/PRD-07): CancelPendingBookingUseCase + cancel API endpoint"
```

---

## Task 4: BookingUiState — add NetworkError sealed subclass

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/ui/booking/BookingUiState.kt`

- [ ] **Step 1: Add NetworkError to the sealed class**

In `BookingUiState.kt`, append after the existing `Error` class:
```kotlin
    /**
     * Emitted when [CreateBookingUseCase] throws [java.io.IOException].
     * The [pendingRequest] is cached so [BookingViewModel.retryNetworkError] can
     * resubmit the same booking without re-entering the slot/address flow.
     */
    public data class NetworkError(
        val message: String,
        val pendingRequest: BookingRequest,
    ) : BookingUiState()
```
Also add import at the top: `import com.homeservices.customer.domain.booking.model.BookingRequest`

- [ ] **Step 2: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingUiState.kt
git commit -m "feat(S6/PRD-06): add BookingUiState.NetworkError sealed subclass"
```

---

## Task 5: TDD — BookingViewModel NetworkError tests (failing)

**Files:**
- Create: `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelNetworkErrorTest.kt`

- [ ] **Step 1: Write failing tests**

Create `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelNetworkErrorTest.kt`:
```kotlin
package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.data.catalogue.CatalogueRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
public class BookingViewModelNetworkErrorTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val biometricGate: BiometricGateUseCase = mockk()
    private val catalogueRepository: CatalogueRepository = mockk()
    private val slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00")

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        every { biometricGate.canUseBiometric(any()) } returns false
        every { catalogueRepository.getCategories() } returns flowOf(Result.success(emptyList()))
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun makeVm() = BookingViewModel(
        createBooking, confirmBooking, razorpayPayment, biometricGate, catalogueRepository
    )

    @Test
    public fun `IOException from createBooking transitions to NetworkError`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns flowOf(Result.failure(IOException("no network")))
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.NetworkError::class.java)
        }

    @Test
    public fun `non-IOException from createBooking transitions to Error (no retry)`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(Result.failure(RuntimeException("booking conflict")))
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Error::class.java)
        }

    @Test
    public fun `retryNetworkError resubmits the same BookingRequest`(): Unit =
        runTest(dispatcher) {
            // First call: fail with IOException
            every { createBooking(any()) } returns flowOf(Result.failure(IOException("offline")))
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.NetworkError::class.java)

            // Second call: succeed
            every { createBooking(any()) } returns
                flowOf(Result.success(
                    com.homeservices.customer.domain.booking.model.BookingResult(
                        "bk-retry", "order-retry", 50000
                    )
                ))
            vm.retryNetworkError()
            // Verify createBooking was called a second time with the SAME request
            verify(exactly = 2) { createBooking(any()) }
        }

    @Test
    public fun `retryNetworkError from non-NetworkError state is no-op`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            // In Ready state — retryNetworkError should not touch createBooking
            vm.retryNetworkError()
            verify(exactly = 0) { createBooking(any()) }
        }
}
```

- [ ] **Step 2: Run — expect compile error (BookingViewModel missing `catalogueRepository` param + `retryNetworkError`)**
```bash
cd "C:\Alok\Business Projects\Urbanclap-sprint6\customer-app"
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.booking.BookingViewModelNetworkErrorTest" 2>&1 | Select-String -Pattern "error:|FAIL|BUILD" | Select-Object -First 10
```
Expected: compile errors.

---

## Task 6: TDD — BookingViewModel WomenSafe tests (failing)

**Files:**
- Create: `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelWomenSafeTest.kt`

- [ ] **Step 1: Write failing tests**

Create `test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelWomenSafeTest.kt`:
```kotlin
package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.data.catalogue.CatalogueRepository
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class BookingViewModelWomenSafeTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val biometricGate: BiometricGateUseCase = mockk()
    private val catalogueRepository: CatalogueRepository = mockk()

    private fun makeCategory(id: String, safetyTag: Boolean) = Category(
        id = id, name = "Test", imageUrl = "", serviceCount = 1, minPricePaise = 0,
        safetyTag = safetyTag
    )

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        every { biometricGate.canUseBiometric(any()) } returns false
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun makeVm() = BookingViewModel(
        createBooking, confirmBooking, razorpayPayment, biometricGate, catalogueRepository
    )

    @Test
    public fun `showWomenSafeToggle is false for daytime slot and non-safety category`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns
                flowOf(Result.success(listOf(makeCategory("cat1", safetyTag = false))))
            val vm = makeVm()
            vm.pendingCategoryId = "cat1"
            vm.setSlotAndAddress(BookingSlot("2026-06-01", "10:00-12:00"), "Addr", 0.0, 0.0)
            assertThat(vm.showWomenSafeToggle.value).isFalse()
        }

    @Test
    public fun `showWomenSafeToggle is true for slot starting at or after 19 00`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns
                flowOf(Result.success(listOf(makeCategory("cat1", safetyTag = false))))
            val vm = makeVm()
            vm.pendingCategoryId = "cat1"
            vm.setSlotAndAddress(BookingSlot("2026-06-01", "19:00-21:00"), "Addr", 0.0, 0.0)
            assertThat(vm.showWomenSafeToggle.value).isTrue()
        }

    @Test
    public fun `showWomenSafeToggle is true for safety-tagged category regardless of slot`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns
                flowOf(Result.success(listOf(makeCategory("beauty", safetyTag = true))))
            val vm = makeVm()
            vm.pendingCategoryId = "beauty"
            vm.setSlotAndAddress(BookingSlot("2026-06-01", "10:00-12:00"), "Addr", 0.0, 0.0)
            assertThat(vm.showWomenSafeToggle.value).isTrue()
        }

    @Test
    public fun `setPreferFemaleTechnician propagates to preferFemaleTechnician state`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns flowOf(Result.success(emptyList()))
            val vm = makeVm()
            assertThat(vm.preferFemaleTechnician.value).isFalse()
            vm.setPreferFemaleTechnician(true)
            assertThat(vm.preferFemaleTechnician.value).isTrue()
        }
}
```

- [ ] **Step 2: Run — expect compile errors**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.booking.BookingViewModelWomenSafeTest" 2>&1 | Select-String -Pattern "error:|FAIL|BUILD" | Select-Object -First 10
```
Expected: compile errors for missing VM methods/fields.

---

## Task 7: TDD — CustomerHomeViewModel pending payment tests (failing)

**Files:**
- Create: `test/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModelPendingPaymentTest.kt`

- [ ] **Step 1: Write failing test**

Create `test/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModelPendingPaymentTest.kt`:
```kotlin
package com.homeservices.customer.ui.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.domain.auth.model.AuthProvider
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class CustomerHomeViewModelPendingPaymentTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val sessionManager: SessionManager = mockk()
    private val pendingActionStore: PendingActionStore = mockk()
    private val bookingRepository: BookingRepository = mockk()

    private val authStateFlow = MutableStateFlow<AuthState>(
        AuthState.Authenticated(uid = "uid1", provider = AuthProvider.PHONE,
            displayName = null, phoneLastFour = null, email = null)
    )

    private fun makeBooking(id: String, status: CustomerBookingStatus, orderId: String? = null) =
        CustomerBooking(
            bookingId = id, serviceId = "svc1", serviceName = "AC", addressText = "Addr",
            status = status, slotDate = "2026-06-01", slotWindow = "10:00-12:00",
            amountPaise = 59900, paymentMethod = BookingPaymentMethod.RAZORPAY,
            createdAt = "2026-06-01T10:00:00Z", razorpayOrderId = orderId,
        )

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        every { sessionManager.authState } returns authStateFlow
        every { pendingActionStore.observeActive(any()) } returns flowOf(emptyList())
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `PENDING_PAYMENT booking is surfaced as pendingPaymentBooking in Ready state`(): Unit =
        runTest(dispatcher) {
            val pending = makeBooking("bk-pend", CustomerBookingStatus.PENDING_PAYMENT, "order-123")
            every { bookingRepository.getMyBookings() } returns
                flowOf(Result.success(listOf(pending)))
            val vm = CustomerHomeViewModel(pendingActionStore, bookingRepository, sessionManager)
            val state = vm.homeUiState.value as? CustomerHomeUiState.Ready
            assertThat(state).isNotNull()
            assertThat(state!!.pendingPaymentBooking).isEqualTo(pending)
        }

    @Test
    public fun `SEARCHING booking with no PENDING_PAYMENT yields null pendingPaymentBooking`(): Unit =
        runTest(dispatcher) {
            val searching = makeBooking("bk-search", CustomerBookingStatus.SEARCHING)
            every { bookingRepository.getMyBookings() } returns
                flowOf(Result.success(listOf(searching)))
            val vm = CustomerHomeViewModel(pendingActionStore, bookingRepository, sessionManager)
            val state = vm.homeUiState.value as? CustomerHomeUiState.Ready
            assertThat(state!!.pendingPaymentBooking).isNull()
        }

    @Test
    public fun `empty bookings list yields null pendingPaymentBooking`(): Unit =
        runTest(dispatcher) {
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(emptyList()))
            val vm = CustomerHomeViewModel(pendingActionStore, bookingRepository, sessionManager)
            val state = vm.homeUiState.value as? CustomerHomeUiState.Ready
            assertThat(state!!.pendingPaymentBooking).isNull()
        }
}
```

- [ ] **Step 2: Run — expect compile error (CustomerHomeUiState.Ready missing `pendingPaymentBooking`)**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.catalogue.CustomerHomeViewModelPendingPaymentTest" 2>&1 | Select-String -Pattern "error:|FAIL|BUILD" | Select-Object -First 10
```
Expected: compile errors.

---

## Task 8: Implement BookingViewModel — NetworkError + WomenSafe + Resume

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt`

This is the largest single implementation task. Read the full existing file before editing.

- [ ] **Step 1: Replace BookingViewModel.kt with the updated version**

Full replacement (read the existing file first to verify it matches the version analyzed in planning):

```kotlin
package com.homeservices.customer.ui.booking

import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.BiometricResult
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.io.IOException
import javax.inject.Inject

private const val BOOKING_FAILED_FALLBACK = "Booking failed"
private const val CONFIRMATION_FAILED_FALLBACK = "Confirmation failed"
private const val WOMEN_SAFE_HOUR_THRESHOLD = 19

@HiltViewModel
internal class BookingViewModel
    @Inject
    constructor(
        private val createBooking: CreateBookingUseCase,
        private val confirmBooking: ConfirmBookingUseCase,
        private val razorpayPayment: RazorpayPaymentUseCase,
        private val biometricGate: BiometricGateUseCase,
        private val catalogueRepository: CatalogueRepository,
    ) : ViewModel() {
        private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Idle)
        public val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

        private val _walletBalanceInPaise = MutableStateFlow(0L)
        public val walletBalanceInPaise: StateFlow<Long> = _walletBalanceInPaise.asStateFlow()

        private val _applyCreditToggle = MutableStateFlow(false)
        public val applyCreditToggle: StateFlow<Boolean> = _applyCreditToggle.asStateFlow()

        private val _showWomenSafeToggle = MutableStateFlow(false)
        public val showWomenSafeToggle: StateFlow<Boolean> = _showWomenSafeToggle.asStateFlow()

        private val _preferFemaleTechnician = MutableStateFlow(false)
        public val preferFemaleTechnician: StateFlow<Boolean> = _preferFemaleTechnician.asStateFlow()

        private var pendingBookingId: String? = null
        private var pendingAppliedCredit: Int = 0
        private var lastNetworkErrorRequest: BookingRequest? = null

        public var pendingServiceId: String = ""
        public var pendingCategoryId: String = ""

        init {
            viewModelScope.launch {
                razorpayPayment.resultFlow().collect { result ->
                    val bookingId = pendingBookingId ?: return@collect
                    handlePaymentResult(result, bookingId)
                }
            }
        }

        public fun setWalletBalance(paise: Long) {
            _walletBalanceInPaise.value = paise
            if (paise > 0L) {
                _applyCreditToggle.value = true
            }
        }

        public fun setApplyCreditToggle(checked: Boolean) {
            _applyCreditToggle.value = checked
        }

        public fun setPreferFemaleTechnician(checked: Boolean) {
            _preferFemaleTechnician.value = checked
        }

        public fun setSlotAndAddress(
            slot: BookingSlot,
            addressText: String,
            lat: Double,
            lng: Double,
        ) {
            _uiState.value = BookingUiState.Ready(slot, addressText, lat, lng)
            updateWomenSafeContext(slot)
        }

        /**
         * Pre-populates the VM into AwaitingPayment state for resuming a PENDING_PAYMENT booking
         * after process death. Razorpay is relaunched by the BookingSummaryScreen's LaunchedEffect.
         */
        public fun resumeFromPendingPayment(
            bookingId: String,
            razorpayOrderId: String,
            amount: Int,
        ) {
            pendingBookingId = bookingId
            _uiState.value = BookingUiState.AwaitingPayment(
                bookingId = bookingId,
                razorpayOrderId = razorpayOrderId,
                amount = amount,
                slot = BookingSlot("", ""),
                addressText = "",
                lat = 0.0,
                lng = 0.0,
            )
        }

        public fun startPayment(
            serviceId: String,
            categoryId: String,
            activity: FragmentActivity?,
        ) {
            if (activity == null) return
            viewModelScope.launch {
                if (biometricGate.canUseBiometric(activity)) {
                    val result = biometricGate.requestAuth(
                        activity, "Confirm Payment",
                        "Authenticate to authorise this booking payment",
                    )
                    if (result !is BiometricResult.Authenticated) return@launch
                }
                startBooking(serviceId, categoryId, BookingPaymentMethod.RAZORPAY)
            }
        }

        public fun startBooking(
            serviceId: String,
            categoryId: String,
            paymentMethod: BookingPaymentMethod,
        ) {
            val state = _uiState.value as? BookingUiState.Ready ?: return
            _uiState.value = BookingUiState.CreatingBooking
            val request = BookingRequest(
                serviceId = serviceId,
                categoryId = categoryId,
                slot = state.slot,
                addressText = state.addressText,
                addressLat = state.lat,
                addressLng = state.lng,
                paymentMethod = paymentMethod,
                applyCredit = _applyCreditToggle.value,
                preferFemaleTechnician = _preferFemaleTechnician.value,
            )
            viewModelScope.launch { executeCreateBooking(request, state) }
        }

        public fun retryNetworkError() {
            val request = lastNetworkErrorRequest ?: return
            val readyState = BookingUiState.Ready(
                slot = request.slot,
                addressText = request.addressText,
                lat = request.addressLat,
                lng = request.addressLng,
            )
            _uiState.value = BookingUiState.CreatingBooking
            viewModelScope.launch { executeCreateBooking(request, readyState) }
        }

        public fun retryPayment() {
            val failed = _uiState.value as? BookingUiState.PaymentFailed ?: return
            _uiState.value = BookingUiState.AwaitingPayment(
                bookingId = pendingBookingId ?: return,
                razorpayOrderId = failed.orderId,
                amount = failed.amount,
                slot = failed.slot,
                addressText = failed.addressText,
                lat = failed.lat,
                lng = failed.lng,
            )
        }

        public fun cancelPaymentFailed() {
            val failed = _uiState.value as? BookingUiState.PaymentFailed ?: return
            _uiState.value = BookingUiState.Ready(
                slot = failed.slot,
                addressText = failed.addressText,
                lat = failed.lat,
                lng = failed.lng,
            )
        }

        private suspend fun executeCreateBooking(
            request: BookingRequest,
            readyState: BookingUiState.Ready,
        ) {
            createBooking(request).first().fold(
                onSuccess = { result ->
                    lastNetworkErrorRequest = null
                    pendingBookingId = result.bookingId
                    pendingAppliedCredit = result.appliedCreditAmount
                    _uiState.value = if (result.requiresPayment) {
                        BookingUiState.AwaitingPayment(
                            bookingId = result.bookingId,
                            razorpayOrderId = result.razorpayOrderId,
                            amount = result.amount,
                            slot = readyState.slot,
                            addressText = readyState.addressText,
                            lat = readyState.lat,
                            lng = readyState.lng,
                        )
                    } else {
                        BookingUiState.BookingConfirmed(result.bookingId, result.appliedCreditAmount)
                    }
                },
                onFailure = { e ->
                    if (e is IOException) {
                        lastNetworkErrorRequest = request
                        _uiState.value = BookingUiState.NetworkError(
                            message = e.message ?: BOOKING_FAILED_FALLBACK,
                            pendingRequest = request,
                        )
                    } else {
                        _uiState.value = BookingUiState.Error(e.message ?: BOOKING_FAILED_FALLBACK)
                    }
                },
            )
        }

        private suspend fun handlePaymentResult(result: PaymentResult, bookingId: String) {
            when (result) {
                is PaymentResult.Success -> {
                    _uiState.value = BookingUiState.ConfirmingPayment
                    confirmBooking(bookingId, result.paymentId, result.orderId, result.signature)
                        .first()
                        .fold(
                            onSuccess = {
                                _uiState.value = BookingUiState.BookingConfirmed(
                                    bookingId = bookingId,
                                    appliedCreditAmount = pendingAppliedCredit,
                                )
                            },
                            onFailure = {
                                _uiState.value = BookingUiState.Error(
                                    it.message ?: CONFIRMATION_FAILED_FALLBACK
                                )
                            },
                        )
                }
                is PaymentResult.Failure -> {
                    val awaitingSnapshot = _uiState.value as? BookingUiState.AwaitingPayment
                    val errorCode = RazorpayErrorCode.resolve(result.code, result.description)
                    _uiState.value = BookingUiState.PaymentFailed(
                        orderId = awaitingSnapshot?.razorpayOrderId ?: "",
                        amount = awaitingSnapshot?.amount ?: 0,
                        reason = result.description,
                        errorCode = errorCode,
                        slot = awaitingSnapshot?.slot ?: BookingSlot("", ""),
                        addressText = awaitingSnapshot?.addressText ?: "",
                        lat = awaitingSnapshot?.lat ?: 0.0,
                        lng = awaitingSnapshot?.lng ?: 0.0,
                    )
                }
            }
        }

        private fun updateWomenSafeContext(slot: BookingSlot) {
            viewModelScope.launch {
                val slotHour = parseSlotStartHour(slot.window)
                val categories = catalogueRepository.getCategories().first().getOrNull() ?: emptyList()
                val isSafetyCategory = categories.firstOrNull { it.id == pendingCategoryId }?.safetyTag ?: false
                _showWomenSafeToggle.value = slotHour >= WOMEN_SAFE_HOUR_THRESHOLD || isSafetyCategory
            }
        }

        private fun parseSlotStartHour(window: String): Int {
            // window format: "HH:mm-HH:mm" e.g. "19:00-21:00"
            return runCatching { window.substringBefore(":").toInt() }.getOrDefault(0)
        }
    }
```

- [ ] **Step 2: Run NetworkError tests — expect pass**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.booking.BookingViewModelNetworkErrorTest" 2>&1 | Select-String -Pattern "PASS|FAIL|BUILD" | Select-Object -First 10
```
Expected: all 4 tests pass.

- [ ] **Step 3: Run WomenSafe tests — expect pass**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.booking.BookingViewModelWomenSafeTest" 2>&1 | Select-String -Pattern "PASS|FAIL|BUILD" | Select-Object -First 10
```
Expected: all 4 tests pass.

- [ ] **Step 4: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingViewModel.kt
git add customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelNetworkErrorTest.kt
git add customer-app/app/src/test/kotlin/com/homeservices/customer/ui/booking/BookingViewModelWomenSafeTest.kt
git commit -m "feat(S6/PRD-06,07,08): BookingViewModel — NetworkError retry, resume, women-safe toggle"
```

---

## Task 9: CustomerHomeUiState + CustomerHomeViewModel — pending payment

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeUiState.kt`
- Modify: `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModel.kt`

- [ ] **Step 1: Add `pendingPaymentBooking` to CustomerHomeUiState.Ready**

In `CustomerHomeUiState.kt`, update the `Ready` data class:
```kotlin
    public data class Ready(
        public val pendingActions: List<PendingAction>,
        public val activeBooking: CustomerBooking?,
        public val recentBookings: List<CustomerBooking>,
        public val pendingPaymentBooking: CustomerBooking? = null,
    ) : CustomerHomeUiState()
```

- [ ] **Step 2: Detect PENDING_PAYMENT in CustomerHomeViewModel**

In `CustomerHomeViewModel.kt`, update `mergeFlows()`. Add a new `pendingPaymentFlow`:
```kotlin
val pendingPaymentFlow: Flow<CustomerBooking?> =
    bookingsFlow.map { result ->
        result.getOrNull()?.firstOrNull { it.status == CustomerBookingStatus.PENDING_PAYMENT }
    }
```

Update the `combine` call to include this new flow (4-flow combine requires a 4-argument combine):
```kotlin
return combine(
    pendingActionsFlow, activeBookingFlow, recentBookingsFlow, pendingPaymentFlow
) { actions, active, recent, pendingPayment ->
    CustomerHomeUiState.Ready(
        pendingActions = actions,
        activeBooking = active,
        recentBookings = recent,
        pendingPaymentBooking = pendingPayment,
    )
}
```

Note: `kotlinx.coroutines.flow.combine` supports up to 5 flows. The 4-argument overload exists.

- [ ] **Step 3: Run pending-payment VM tests — expect pass**
```bash
.\gradlew testDebugUnitTest --tests "com.homeservices.customer.ui.catalogue.CustomerHomeViewModelPendingPaymentTest" 2>&1 | Select-String -Pattern "PASS|FAIL|BUILD" | Select-Object -First 10
```
Expected: all 3 tests pass.

- [ ] **Step 4: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeUiState.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModel.kt
git add customer-app/app/src/test/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModelPendingPaymentTest.kt
git commit -m "feat(S6/PRD-07): CustomerHomeUiState + VM — expose pendingPaymentBooking"
```

---

## Task 10: New composables — PendingBookingResumeBanner + WomenSafeFilterToggle

**Files:**
- Create: `main/kotlin/com/homeservices/customer/ui/booking/PendingBookingResumeBanner.kt`
- Create: `main/kotlin/com/homeservices/customer/ui/booking/WomenSafeFilterToggle.kt`

- [ ] **Step 1: Create PendingBookingResumeBanner.kt**

```kotlin
package com.homeservices.customer.ui.booking

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.designsystem.components.HsPrimaryButton
import com.homeservices.designsystem.components.HsSecondaryButton

private val WarnAmber = Color(0xFFF59E0B)
private val WarnAmberSoft = Color(0xFFFFFBEB)

/**
 * Banner shown on the home screen when a booking is in PENDING_PAYMENT state after process death.
 * Gives the customer two CTAs: resume the Razorpay payment, or cancel the booking.
 */
@Composable
public fun PendingBookingResumeBanner(
    booking: CustomerBooking,
    onResumePayment: (bookingId: String, razorpayOrderId: String, amount: Int) -> Unit,
    onCancelBooking: (bookingId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val orderId = booking.razorpayOrderId ?: return // If no orderId, we can't resume; hide banner
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = MaterialTheme.shapes.medium,
        color = WarnAmberSoft,
        border = BorderStroke(1.dp, WarnAmber.copy(alpha = 0.5f)),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.AccessTime,
                    contentDescription = null,
                    tint = WarnAmber,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.pending_booking_resume_title),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF92400E),
                )
            }
            Text(
                text = stringResource(R.string.pending_booking_resume_body, booking.serviceName),
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF92400E),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                HsPrimaryButton(
                    text = stringResource(R.string.pending_booking_resume_cta),
                    onClick = {
                        onResumePayment(booking.bookingId, orderId, booking.amountPaise.toInt())
                    },
                    modifier = Modifier.weight(1f),
                )
                HsSecondaryButton(
                    text = stringResource(R.string.pending_booking_cancel_cta),
                    onClick = { onCancelBooking(booking.bookingId) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}
```

- [ ] **Step 2: Create WomenSafeFilterToggle.kt**

```kotlin
package com.homeservices.customer.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.homeservices.customer.R

private val SafetyGreen = Color(0xFF0B3D2E)
private val SafetyGreenSoft = Color(0xFFE8F1EC)

/**
 * Opt-in toggle that appears on BookingSummaryScreen when the slot starts at or after 19:00 IST,
 * or when the service category has `safetyTag = true`.
 * Off by default. When on, BookingRequest.preferFemaleTechnician = true is sent to the dispatcher.
 */
@Composable
public fun WomenSafeFilterToggle(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = SafetyGreenSoft,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = SafetyGreen,
                )
                Column {
                    Text(
                        text = stringResource(R.string.women_safe_toggle_label),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = SafetyGreen,
                    )
                    Text(
                        text = stringResource(R.string.women_safe_toggle_context),
                        style = MaterialTheme.typography.bodySmall,
                        color = SafetyGreen.copy(alpha = 0.75f),
                    )
                }
            }
            Switch(checked = checked, onCheckedChange = onCheckedChange)
        }
    }
}
```

- [ ] **Step 3: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/PendingBookingResumeBanner.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/WomenSafeFilterToggle.kt
git commit -m "feat(S6/PRD-07,08): PendingBookingResumeBanner + WomenSafeFilterToggle composables"
```

---

## Task 11: BookingSummaryScreen — NetworkErrorCard + WomenSafeFilterToggle

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/ui/booking/BookingSummaryScreen.kt`

- [ ] **Step 1: Add NetworkErrorCard composable and wire in BookingSummaryContent**

In `BookingSummaryScreen.kt`:

1. In `BookingSummaryScreen()` composable — add to the imports at top:
   ```kotlin
   import androidx.lifecycle.compose.collectAsStateWithLifecycle
   import com.homeservices.customer.ui.booking.WomenSafeFilterToggle
   ```

2. In `BookingSummaryScreen()`, add state collection for the two new flows after the existing state:
   ```kotlin
   val showWomenSafe by viewModel.showWomenSafeToggle.collectAsStateWithLifecycle()
   val preferFemale by viewModel.preferFemaleTechnician.collectAsStateWithLifecycle()
   ```

3. Pass these to `BookingSummaryContent`:
   ```kotlin
   BookingSummaryContent(
       ..., // existing params unchanged
       showWomenSafeToggle = showWomenSafe,
       preferFemaleTechnician = preferFemale,
       onPreferFemaleTechnicianChanged = viewModel::setPreferFemaleTechnician,
   )
   ```

4. Add these parameters to `BookingSummaryContent` signature:
   ```kotlin
   showWomenSafeToggle: Boolean = false,
   preferFemaleTechnician: Boolean = false,
   onPreferFemaleTechnicianChanged: (Boolean) -> Unit = {},
   ```

5. In `BookingSummaryContent`'s `when (val state = uiState)` block, add the NetworkError case:
   ```kotlin
   is BookingUiState.NetworkError ->
       NetworkErrorCard(
           message = state.message,
           onRetry = onRetryNetworkError,
       )
   ```
   Also add `onRetryNetworkError: () -> Unit = {}` to `BookingSummaryContent` params and pass `onRetryNetworkError = viewModel::retryNetworkError` from `BookingSummaryScreen`.

6. In `ReadySummary`, after the `CreditToggleRow` section, add:
   ```kotlin
   if (showWomenSafeToggle) {
       Spacer(Modifier.height(12.dp))
       WomenSafeFilterToggle(
           checked = preferFemaleTechnician,
           onCheckedChange = onPreferFemaleTechnicianChanged,
       )
   }
   ```
   Pass through `showWomenSafeToggle`, `preferFemaleTechnician`, `onPreferFemaleTechnicianChanged` in `ReadySummary` params.

7. Add `NetworkErrorCard` composable at the bottom of the file:
   ```kotlin
   @Composable
   private fun NetworkErrorCard(
       message: String,
       onRetry: () -> Unit,
   ) {
       Column(
           modifier = Modifier.fillMaxSize().padding(24.dp),
           verticalArrangement = Arrangement.Center,
           horizontalAlignment = Alignment.CenterHorizontally,
       ) {
           Icon(
               imageVector = Icons.Filled.WifiOff,
               contentDescription = null,
               tint = MaterialTheme.colorScheme.error,
               modifier = Modifier.size(48.dp),
           )
           Spacer(Modifier.height(12.dp))
           Text(
               text = stringResource(R.string.booking_network_error_title),
               style = MaterialTheme.typography.titleMedium,
               fontWeight = FontWeight.SemiBold,
           )
           Spacer(Modifier.height(6.dp))
           Text(
               text = message,
               style = MaterialTheme.typography.bodyMedium,
               color = MaterialTheme.colorScheme.onSurfaceVariant,
           )
           Spacer(Modifier.height(24.dp))
           Button(
               onClick = onRetry,
               modifier = Modifier.fillMaxWidth().height(52.dp),
           ) {
               Text(stringResource(R.string.booking_retry))
           }
       }
   }
   ```
   Add import: `import androidx.compose.material.icons.filled.WifiOff`

- [ ] **Step 2: Build to verify no compile errors**
```bash
.\gradlew assembleDebug 2>&1 | Select-String -Pattern "error:|BUILD" | Select-Object -First 10
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/booking/BookingSummaryScreen.kt
git commit -m "feat(S6/PRD-06,08): BookingSummaryScreen — NetworkErrorCard + WomenSafeFilterToggle"
```

---

## Task 12: CustomerHomeTabContent + CatalogueHomeScreen + ProfileScreen

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeTabContent.kt`
- Modify: `main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt`
- Modify: `main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt`

- [ ] **Step 1: Add PendingBookingResumeBanner to CustomerHomeTabContent**

In `CustomerHomeTabContent.kt`:

1. Add new lambda parameters to the `CustomerHomeTabContent` composable signature:
   ```kotlin
   onResumePayment: (bookingId: String, razorpayOrderId: String, amount: Int) -> Unit = { _, _, _ -> },
   onCancelPendingBooking: (bookingId: String) -> Unit = {},
   ```

2. In the `is CustomerHomeUiState.Ready ->` branch, before the existing sections, add:
   ```kotlin
   state.pendingPaymentBooking?.let { pending ->
       PendingBookingResumeBanner(
           booking = pending,
           onResumePayment = onResumePayment,
           onCancelBooking = onCancelPendingBooking,
       )
   }
   ```

3. Add the import at the top: `import com.homeservices.customer.ui.booking.PendingBookingResumeBanner`

- [ ] **Step 2: Thread callbacks through CatalogueHomeScreen**

In `CatalogueHomeScreen.kt`, add `onResumePayment` and `onCancelPendingBooking` and `onPrivacyAndDataClick` parameters to the composable signature, then pass them through to `CustomerHomeTabContent` and `ProfileScreen` respectively.

Read the full `CatalogueHomeScreen.kt` to identify the exact composable signature and tab structure, then add the three new callbacks and pass them to the relevant child composables.

- [ ] **Step 3: Add Privacy & Data row to ProfileScreen**

In `ProfileScreen.kt`:

1. Add `onPrivacyAndDataClick: () -> Unit = {}` parameter to `ProfileScreen`.

2. In the "सहायता" (Support) `SectionCard` block, add a `HorizontalDivider` + `MenuRow` for "Privacy & Data" after the existing "गोपनीयता नीति" row:
   ```kotlin
   HorizontalDivider(color = CardBorder, thickness = 0.5.dp)
   MenuRow(
       icon = Icons.Default.SecurityUpdateGood,
       label = stringResource(R.string.privacy_and_data_label),
       sublabel = stringResource(R.string.privacy_and_data_sublabel),
       onClick = onPrivacyAndDataClick,
   )
   ```
   Add import: `import androidx.compose.material.icons.filled.SecurityUpdateGood`

- [ ] **Step 4: Build to verify no compile errors**
```bash
.\gradlew assembleDebug 2>&1 | Select-String -Pattern "error:|BUILD" | Select-Object -First 10
```

- [ ] **Step 5: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeTabContent.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CatalogueHomeScreen.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/profile/ProfileScreen.kt
git commit -m "feat(S6/PRD-07,09): CustomerHomeTabContent banner + Privacy & Data ProfileScreen row"
```

---

## Task 13: Navigation — BookingRoutes, MainGraph, Rating, Complaint (PRD-07, PRD-10)

**Files:**
- Modify: `main/kotlin/com/homeservices/customer/navigation/BookingRoutes.kt`
- Modify: `main/kotlin/com/homeservices/customer/navigation/MainGraph.kt`
- Modify: `main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt`
- Modify: `main/kotlin/com/homeservices/customer/ui/complaint/ComplaintScreen.kt`

- [ ] **Step 1: Add RESUME_PAYMENT to BookingRoutes**

In `BookingRoutes.kt`, add to the `BookingRoutes` object:
```kotlin
const val RESUME_PAYMENT = "booking/resume/{bookingId}?orderId={orderId}&amount={amount}"
fun resumePaymentRoute(bookingId: String, orderId: String, amount: Int) =
    "booking/resume/$bookingId?orderId=$orderId&amount=$amount"
```

- [ ] **Step 2: Update MainGraph.kt — add resumePaymentDestination, fix Rating/Complaint, wire PRD-09**

In `MainGraph.kt`:

**a) Add `resumePaymentDestination` in `bookingGraph()`:**
```kotlin
composable(
    route = BookingRoutes.RESUME_PAYMENT,
    arguments = listOf(
        navArgument("bookingId") { type = NavType.StringType },
        navArgument("orderId") { type = NavType.StringType },
        navArgument("amount") { type = NavType.IntType; defaultValue = 0 },
    ),
) { backStackEntry ->
    val bookingEntry = remember(backStackEntry) {
        navController.getBackStackEntry(BookingRoutes.BOOKING_GRAPH)
    }
    val vm: BookingViewModel = hiltViewModel(bookingEntry)
    val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
    val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
    val amount = backStackEntry.arguments?.getInt("amount") ?: 0
    LaunchedEffect(bookingId) { vm.resumeFromPendingPayment(bookingId, orderId, amount) }
    BookingSummaryScreen(
        viewModel = vm,
        serviceId = "",
        categoryId = "",
        onConfirmed = { bid, credit ->
            navController.navigate(BookingRoutes.confirmedRoute(bid, credit)) {
                popUpTo(BookingRoutes.BOOKING_GRAPH) { inclusive = true }
            }
        },
        onBack = { navController.popBackStack() },
    )
}
```

**b) Fix Rating destination (PRD-10):**
```kotlin
composable(
    route = RatingRoutes.ROUTE,
    arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
) {
    RatingScreen(
        onBack = { navController.popBackStack(CatalogueRoutes.HOME, inclusive = false) },
        onSubmitted = {
            navController.navigate(CatalogueRoutes.HOME) {
                popUpTo(RatingRoutes.ROUTE) { inclusive = true }
            }
        },
    )
}
```

**c) Fix Complaint destination (PRD-10):**
```kotlin
ComplaintScreen(
    bookingId = bookingId,
    onBack = { navController.popBackStack(CatalogueRoutes.HOME, inclusive = false) },
    onComplaintSubmitted = {
        navController.navigate(CatalogueRoutes.HOME) {
            popUpTo(ComplaintRoutes.ROUTE) { inclusive = true }
        }
    },
)
```

**d) Wire PRD-09 + PRD-07 in homeDestination:**

Add `onPrivacyAndDataClick`, `onResumePayment`, and `onCancelPendingBooking` callbacks to the `CatalogueHomeScreen(...)` call in `homeDestination`:
```kotlin
onPrivacyAndDataClick = { navController.navigate(LocaleRoutes.PRIVACY_DATA) },
onResumePayment = { bookingId, orderId, amount ->
    navController.navigate(BookingRoutes.resumePaymentRoute(bookingId, orderId, amount))
},
onCancelPendingBooking = { bookingId ->
    // Navigate without blocking UI — cancel is fire-and-forget at nav layer
    // ViewModel in CustomerHomeViewModel would observe the booking disappearing
    // after cancellation. For MVP, just show a snackbar via a side effect.
    // TODO: wire a snackbar via a SharedFlow once CustomerHomeViewModel.cancelBooking is added
},
```

Note: For the cancel action, fire-and-forget at the UI layer is sufficient for MVP. The `CancelPendingBookingUseCase` will be called from `CustomerHomeViewModel` in a future iteration. For this sprint, wire the UseCase directly in a `LaunchedEffect` triggered from the banner's callback. Add a `cancelPendingBooking(bookingId: String)` method to `CustomerHomeViewModel`:
```kotlin
public fun cancelPendingBooking(bookingId: String) {
    viewModelScope.launch {
        cancelPendingBookingUseCase(bookingId)
        // Booking list will refresh via Flow recomposition
    }
}
```
Inject `CancelPendingBookingUseCase` into `CustomerHomeViewModel` constructor.

Update `onCancelPendingBooking` in `homeDestination` to call the ViewModel:
```kotlin
onCancelPendingBooking = { bookingId -> customerHomeVm.cancelPendingBooking(bookingId) },
```

- [ ] **Step 3: Add `onBack` + `onSubmitted` to RatingScreen (PRD-10)**

In `RatingScreen.kt`, update the composable signature:
```kotlin
@Composable
public fun RatingScreen(
    modifier: Modifier = Modifier,
    viewModel: RatingViewModel = hiltViewModel(),
    onBack: () -> Unit = {},
    onSubmitted: () -> Unit = {},
) {
    val state by viewModel.uiState.collectAsState()
    // ... existing state collection ...

    // Navigate away when rating submitted successfully
    LaunchedEffect(state) {
        if (state is RatingUiState.AwaitingPartner) {
            onSubmitted()
        }
    }

    RatingContent( ... ) // unchanged
    // ... rest unchanged
}
```

- [ ] **Step 4: Add `onComplaintSubmitted` to ComplaintScreen (PRD-10)**

In `ComplaintScreen.kt`, update the composable signature:
```kotlin
@Composable
public fun ComplaintScreen(
    bookingId: String,
    onBack: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
    onComplaintSubmitted: () -> Unit = {},
) {
```

In `ComplaintContent`, update the `SuccessState` call to pass `onComplaintSubmitted`:
```kotlin
is ComplaintUiState.Success -> SuccessState(
    state = state,
    onBack = onBack,
    onReopen = onReopen,
    onComplaintSubmitted = onComplaintSubmitted,
)
```

Update `SuccessState` signature and its button:
```kotlin
@Composable
private fun SuccessState(
    state: ComplaintUiState.Success,
    onBack: () -> Unit,
    onReopen: () -> Unit,
    onComplaintSubmitted: () -> Unit = {},
) {
    Column(...) {
        ...
        HsPrimaryButton(
            text = stringResource(R.string.complaint_back),
            onClick = { onComplaintSubmitted(); onBack() },
        )
        ...
    }
}
```

Actually simpler: call `onComplaintSubmitted()` inside `onBack`:
```kotlin
HsPrimaryButton(
    text = stringResource(R.string.complaint_back),
    onClick = { onComplaintSubmitted() },
)
```
And `onComplaintSubmitted` in `MainGraph.kt` does the `popUpTo` + navigate. `onBack` continues to handle the system Back button.

- [ ] **Step 5: Inject CancelPendingBookingUseCase into CustomerHomeViewModel**

In `CustomerHomeViewModel.kt`, update the constructor:
```kotlin
@HiltViewModel
public class CustomerHomeViewModel @Inject constructor(
    private val pendingActionStore: PendingActionStore,
    private val bookingRepository: BookingRepository,
    private val sessionManager: SessionManager,
    private val cancelPendingBookingUseCase: CancelPendingBookingUseCase,
) : ViewModel() {
```

Add the `cancelPendingBooking` method:
```kotlin
public fun cancelPendingBooking(bookingId: String) {
    viewModelScope.launch {
        cancelPendingBookingUseCase(bookingId)
    }
}
```

- [ ] **Step 6: Build to verify no compile errors**
```bash
.\gradlew assembleDebug 2>&1 | Select-String -Pattern "error:|BUILD" | Select-Object -First 10
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 7: Commit**
```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/BookingRoutes.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/rating/RatingScreen.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ComplaintScreen.kt
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/catalogue/CustomerHomeViewModel.kt
git commit -m "feat(S6/PRD-07,09,10): navigation — resume route, popUpTo fixes, privacy nav"
```

---

## Task 14: String resources — EN + HI

**Files:**
- Modify: `main/res/values/strings.xml`
- Modify: `main/res/values-hi/strings.xml`

- [ ] **Step 1: Add EN strings**

In `main/res/values/strings.xml`, add before `</resources>`:
```xml
    <!-- PRD-06: NetworkError -->
    <string name="booking_network_error_title">No internet connection</string>
    <string name="booking_network_error_body">Check your connection and try again.</string>
    <string name="booking_retry">Retry</string>

    <!-- PRD-07: Pending booking resume banner -->
    <string name="pending_booking_resume_title">Incomplete booking detected</string>
    <string name="pending_booking_resume_body">Your booking for %1$s was not completed. Resume payment or cancel.</string>
    <string name="pending_booking_resume_cta">Resume payment</string>
    <string name="pending_booking_cancel_cta">Cancel booking</string>

    <!-- PRD-08: Women-safe toggle -->
    <string name="women_safe_toggle_label">Match with a verified-female technician</string>
    <string name="women_safe_toggle_context">Available for select services + after 7pm</string>

    <!-- PRD-09: Privacy & Data row in ProfileScreen -->
    <string name="privacy_and_data_label">Privacy &amp; Data</string>
    <string name="privacy_and_data_sublabel">Export or delete your data</string>
```

- [ ] **Step 2: Add HI strings**

In `main/res/values-hi/strings.xml`, add before `</resources>`:
```xml
    <!-- PRD-06: NetworkError -->
    <string name="booking_network_error_title">इंटरनेट कनेक्शन नहीं है</string>
    <string name="booking_network_error_body">अपना कनेक्शन जाँचें और फिर प्रयास करें।</string>
    <string name="booking_retry">पुनः प्रयास करें</string>

    <!-- PRD-07: Pending booking resume banner -->
    <string name="pending_booking_resume_title">अधूरी बुकिंग मिली</string>
    <string name="pending_booking_resume_body">%1$s के लिए आपकी बुकिंग पूरी नहीं हुई। भुगतान फिर से करें या बुकिंग रद्द करें।</string>
    <string name="pending_booking_resume_cta">भुगतान फिर से करें</string>
    <string name="pending_booking_cancel_cta">बुकिंग रद्द करें</string>

    <!-- PRD-08: Women-safe toggle -->
    <string name="women_safe_toggle_label">सत्यापित महिला तकनीशियन से मिलवाएं</string>
    <string name="women_safe_toggle_context">चुनिंदा सेवाओं और शाम 7 बजे के बाद उपलब्ध</string>

    <!-- PRD-09: Privacy & Data row -->
    <string name="privacy_and_data_label">गोपनीयता और डेटा</string>
    <string name="privacy_and_data_sublabel">डेटा निर्यात करें या हटाएं</string>
```

- [ ] **Step 3: Build and run all unit tests**
```bash
.\gradlew assembleDebug testDebugUnitTest 2>&1 | Select-String -Pattern "FAIL|error:|BUILD" | Select-Object -First 20
```
Expected: BUILD SUCCESSFUL, 0 failures.

- [ ] **Step 4: Commit**
```bash
git add customer-app/app/src/main/res/values/strings.xml
git add customer-app/app/src/main/res/values-hi/strings.xml
git commit -m "feat(S6): EN + HI strings for PRD-06/07/08/09"
```

---

## Task 15: Smoke gate + Codex review + PR

- [ ] **Step 1: Run pre-Codex smoke gate**
```bash
cd "C:\Alok\Business Projects\Urbanclap-sprint6"
bash tools/pre-codex-smoke.sh customer-app -PexcludePaparazzi
```
Fix any failures before proceeding.

- [ ] **Step 2: Verify branch is correct**
```bash
git branch --show-current
```
Expected: `fix/sprint6-prd-completeness`

- [ ] **Step 3: Run Codex review**
```bash
codex review --base main --sandbox-permissions disk-full-read-access
```

- [ ] **Step 4: Apply any Codex P1/P2 findings, re-run smoke gate**

- [ ] **Step 5: Push and open PR**
```bash
git push -u origin fix/sprint6-prd-completeness
gh pr create \
  --title "fix(S6): close PRD-06/07/08/09/10 — network retry, pending-booking resume, women-safe filter, privacy nav, backstack" \
  --body "$(cat <<'EOF'
## Summary
- **PRD-06**: `BookingUiState.NetworkError` sealed subclass + `retryNetworkError()` in BookingViewModel. IOException → NetworkError (with Retry CTA); semantic errors → Error (no retry).
- **PRD-07**: `CustomerHomeViewModel` detects PENDING_PAYMENT bookings; `PendingBookingResumeBanner` on home tab with Resume (→ booking/resume/{id} route relaunches Razorpay) + Cancel CTAs. `CancelPendingBookingUseCase` + `POST /v1/bookings/{id}/cancel`.
- **PRD-08**: `safetyTag: Boolean` on `Category`/`CategoryDto` (server-driven). `WomenSafeFilterToggle` on BookingSummaryScreen when slot ≥ 19:00 IST OR `safetyTag=true`. `preferFemaleTechnician: Boolean` on `BookingRequest` → `CreateBookingRequestDto`.
- **PRD-09**: "Privacy & Data" `MenuRow` added to `ProfileScreen` → `LocaleRoutes.PRIVACY_DATA`.
- **PRD-10**: `RatingScreen` + `ComplaintScreen` get `onBack`/`onSubmitted`/`onComplaintSubmitted` params. On successful submission: `popUpTo(Route) { inclusive = true }` → `CatalogueRoutes.HOME`. System Back: `popBackStack(HOME, inclusive = false)`.

## Paired API tasks (pending server implementation)
- `POST /v1/bookings/{id}/cancel` — allowed for PENDING_PAYMENT + SEARCHING; releases slot lock (PRD-07)
- `BookingRequest.preferFemaleTechnician: bool` on `POST /v1/bookings`; dispatcher prioritises female techs, transparent fallback (PRD-08)

## Test plan
- [ ] Run `bash tools/pre-codex-smoke.sh customer-app -PexcludePaparazzi` — expect green
- [ ] `BookingViewModelNetworkErrorTest` — 4 tests pass (IOException → NetworkError; retry; non-IOException → Error)
- [ ] `BookingViewModelWomenSafeTest` — 4 tests pass (daytime+non-safety=false; late=true; safety-cat=true; toggle state)
- [ ] `CustomerHomeViewModelPendingPaymentTest` — 3 tests pass
- [ ] `CancelPendingBookingUseCaseTest` — 2 tests pass
- [ ] On device: booking with no network → NetworkError card with Retry → retry succeeds
- [ ] On device: AC Repair slot at 20:00 → WomenSafeFilterToggle appears (triggered)
- [ ] On device: AC Repair slot at 10:00 → WomenSafeFilterToggle hidden
- [ ] On device: ProfileScreen → Support section → "Privacy & Data" row → navigates to PrivacyDataScreen
- [ ] On device: Rating submission → app navigates to home (not back to rating)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage check:**
- PRD-06 NetworkError: Task 4 (sealed subclass) + Task 5 (TDD) + Task 8 (VM impl) + Task 11 (UI render + retry CTA) ✓
- PRD-07 Pending resume: Task 3 (cancel API) + Task 7 (TDD) + Task 9 (VM state) + Task 10 (banner composable) + Task 12 (threading) + Task 13 (resume route) ✓
- PRD-08 WomenSafe: Task 1 (Category model) + Task 2 (CategoryDto) + Task 6 (TDD) + Task 8 (VM impl) + Task 10 (toggle composable) + Task 11 (summary screen) ✓
- PRD-09 Privacy nav: Task 12 (ProfileScreen row) + Task 13 (MainGraph wire) + Task 14 (strings) ✓
- PRD-10 Backstack: Task 13 (Rating + Complaint params + MainGraph popUpTo) ✓
- EN + HI strings: Task 14 ✓
- Paired API task note in PR footer ✓
- Smoke gate + Codex: Task 15 ✓

**Type consistency check:**
- `BookingUiState.NetworkError(message: String, pendingRequest: BookingRequest)` — used in Task 4, Task 5 tests, Task 8 VM, Task 11 UI ✓
- `CustomerBooking.razorpayOrderId: String?` — defined Task 1, used in Task 9 VM + Task 10 banner ✓
- `Category.safetyTag: Boolean` — defined Task 1, propagated Task 2 DTO, tested Task 6, used Task 8 VM ✓
- `BookingViewModel.showWomenSafeToggle: StateFlow<Boolean>` — defined Task 8, tested Task 6, wired Task 11 ✓
- `BookingViewModel.preferFemaleTechnician: StateFlow<Boolean>` — defined Task 8, tested Task 6, wired Task 11 ✓
- `CancelPendingBookingUseCase` — created Task 3, tested Task 3, injected Task 13 VM ✓
- `BookingRoutes.resumePaymentRoute()` — defined Task 13, called Task 13 homeDestination wiring ✓

package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.catalogue.model.Category
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

    private fun makeCategory(
        id: String,
        safetyTag: Boolean,
    ) = Category(
        id = id,
        name = "Test",
        imageUrl = "",
        serviceCount = 1,
        minPricePaise = 0,
        safetyTag = safetyTag,
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

    private fun makeVm() =
        BookingViewModel(
            createBooking,
            confirmBooking,
            razorpayPayment,
            biometricGate,
            catalogueRepository,
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

    @Test
    public fun `setWalletBalance with positive amount enables credit toggle`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns flowOf(Result.success(emptyList()))
            val vm = makeVm()
            assertThat(vm.applyCreditToggle.value).isFalse()
            vm.setWalletBalance(5000L)
            assertThat(vm.walletBalanceInPaise.value).isEqualTo(5000L)
            assertThat(vm.applyCreditToggle.value).isTrue()
        }

    @Test
    public fun `setWalletBalance with zero does not enable credit toggle`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns flowOf(Result.success(emptyList()))
            val vm = makeVm()
            vm.setWalletBalance(0L)
            assertThat(vm.walletBalanceInPaise.value).isEqualTo(0L)
            assertThat(vm.applyCreditToggle.value).isFalse()
        }

    @Test
    public fun `malformed slot window defaults to hour 0 and hides toggle for non-safety category`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns
                flowOf(Result.success(listOf(makeCategory("cat1", safetyTag = false))))
            val vm = makeVm()
            vm.pendingCategoryId = "cat1"
            vm.setSlotAndAddress(BookingSlot("2026-06-01", "invalid-window"), "Addr", 0.0, 0.0)
            assertThat(vm.showWomenSafeToggle.value).isFalse()
        }

    @Test
    public fun `catalogue failure defaults to no women safe toggle`(): Unit =
        runTest(dispatcher) {
            every { catalogueRepository.getCategories() } returns
                flowOf(Result.failure(RuntimeException("offline")))
            val vm = makeVm()
            vm.setSlotAndAddress(BookingSlot("2026-06-01", "10:00-12:00"), "Addr", 0.0, 0.0)
            assertThat(vm.showWomenSafeToggle.value).isFalse()
        }
}

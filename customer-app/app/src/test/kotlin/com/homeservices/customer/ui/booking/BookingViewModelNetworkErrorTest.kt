package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingSlot
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

    private fun makeVm() =
        BookingViewModel(
            createBooking,
            confirmBooking,
            razorpayPayment,
            biometricGate,
            catalogueRepository,
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
            every { createBooking(any()) } returns flowOf(Result.failure(IOException("offline")))
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.NetworkError::class.java)

            every { createBooking(any()) } returns
                flowOf(
                    Result.success(
                        com.homeservices.customer.domain.booking.model.BookingResult(
                            "bk-retry",
                            "order-retry",
                            50000,
                        ),
                    ),
                )
            vm.retryNetworkError()
            verify(exactly = 2) { createBooking(any()) }
        }

    @Test
    public fun `retryNetworkError from non-NetworkError state is no-op`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.retryNetworkError()
            verify(exactly = 0) { createBooking(any()) }
        }

    @Test
    public fun `startBooking when state is not Ready is a no-op`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            // state is Idle, not Ready
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            verify(exactly = 0) { createBooking(any()) }
        }

    @Test
    public fun `resumeFromPendingPayment transitions to AwaitingPayment`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.resumeFromPendingPayment("bk-resume", "order-resume", 75000)
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.AwaitingPayment::class.java)
            assertThat((state as BookingUiState.AwaitingPayment).razorpayOrderId).isEqualTo("order-resume")
        }
}

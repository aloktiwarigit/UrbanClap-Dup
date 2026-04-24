package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.PaymentResult
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
public class BookingViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00")

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment)

    @Test
    public fun `setSlotAndAddress transitions to Ready`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Ready::class.java)
            assertThat((state as BookingUiState.Ready).addressText).isEqualTo("123 Main St")
        }

    @Test
    public fun `startPayment transitions to AwaitingPayment on success`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.AwaitingPayment::class.java)
            assertThat((state as BookingUiState.AwaitingPayment).razorpayOrderId).isEqualTo("order_1")
        }

    @Test
    public fun `startPayment sets Error when createBooking fails`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.failure(RuntimeException("server error")),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Error::class.java)
            assertThat((state as BookingUiState.Error).message).isEqualTo("server error")
        }

    @Test
    public fun `payment Success confirms booking and sets BookingConfirmed`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            every { confirmBooking("bk1", "pay_1", "order_1", "sig_1") } returns flowOf(Result.success("bk1"))
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            // Simulate Razorpay success callback via bus
            bus.post(PaymentResult.Success(paymentId = "pay_1", orderId = "order_1", signature = "sig_1"))
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.BookingConfirmed::class.java)
            assertThat((state as BookingUiState.BookingConfirmed).bookingId).isEqualTo("bk1")
        }

    @Test
    public fun `payment Failure sets Error`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Failure(code = 2, description = "cancelled"))
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Error::class.java)
            assertThat((state as BookingUiState.Error).message).contains("cancelled")
        }

    @Test
    public fun `confirmBooking failure sets Error`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            every { confirmBooking("bk1", "pay_1", "order_1", "sig_1") } returns
                flowOf(
                    Result.failure(RuntimeException("confirm failed")),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Success(paymentId = "pay_1", orderId = "order_1", signature = "sig_1"))
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Error::class.java)
            assertThat((state as BookingUiState.Error).message).isEqualTo("confirm failed")
        }
}

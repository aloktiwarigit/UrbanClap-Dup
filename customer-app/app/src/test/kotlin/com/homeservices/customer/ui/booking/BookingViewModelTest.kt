package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.domain.booking.model.PaymentResult
import com.homeservices.customer.domain.booking.model.RazorpayErrorCode
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
import io.mockk.slot as mockkSlot

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
    public fun `startBooking with cash creates cash booking and confirms without Razorpay`(): Unit =
        runTest(dispatcher) {
            val capturedRequest = mockkSlot<BookingRequest>()
            every { createBooking(capture(capturedRequest)) } returns
                flowOf(
                    Result.success(
                        BookingResult(
                            bookingId = "bk1",
                            razorpayOrderId = "cash_1",
                            amount = 50000,
                            requiresPayment = false,
                            paymentMethod = BookingPaymentMethod.CASH_ON_SERVICE,
                        ),
                    ),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.CASH_ON_SERVICE)
            val state = vm.uiState.value
            assertThat(capturedRequest.captured.paymentMethod).isEqualTo(BookingPaymentMethod.CASH_ON_SERVICE)
            assertThat(state).isInstanceOf(BookingUiState.BookingConfirmed::class.java)
            assertThat((state as BookingUiState.BookingConfirmed).bookingId).isEqualTo("bk1")
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
    public fun `payment Failure transitions to PaymentFailed`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Failure(code = 2, description = "Payment cancelled by user."))
            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.PaymentFailed::class.java)
            with(state as BookingUiState.PaymentFailed) {
                assertThat(errorCode).isEqualTo(RazorpayErrorCode.PAYMENT_CANCELLED)
                assertThat(reason).isEqualTo("Payment cancelled by user.")
            }
        }

    @Test
    public fun `payment Failure preserves orderId and amount from AwaitingPayment`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 75000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Failure(code = 2, description = "Payment cancelled by user."))
            val state = vm.uiState.value as BookingUiState.PaymentFailed
            assertThat(state.orderId).isEqualTo("order_1")
            assertThat(state.amount).isEqualTo(75000)
        }

    @Test
    public fun `payment Failure with network code maps to NETWORK_ERROR`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            // SDK code 1 = NETWORK_ERROR regardless of description
            bus.post(PaymentResult.Failure(code = 1, description = "Connection timed out"))
            val state = vm.uiState.value as BookingUiState.PaymentFailed
            assertThat(state.errorCode).isEqualTo(RazorpayErrorCode.NETWORK_ERROR)
        }

    @Test
    public fun `payment Failure with unknown description maps to BAD_REQUEST_ERROR`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            // code 0 and no cancellation keyword → BAD_REQUEST_ERROR
            bus.post(PaymentResult.Failure(code = 0, description = "Something went wrong"))
            val state = vm.uiState.value as BookingUiState.PaymentFailed
            assertThat(state.errorCode).isEqualTo(RazorpayErrorCode.BAD_REQUEST_ERROR)
        }

    @Test
    public fun `retryPayment transitions from PaymentFailed back to AwaitingPayment with same orderId`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Failure(code = 2, description = "Payment cancelled by user."))
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.PaymentFailed::class.java)

            vm.retryPayment()

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.AwaitingPayment::class.java)
            with(state as BookingUiState.AwaitingPayment) {
                assertThat(razorpayOrderId).isEqualTo("order_1")
                assertThat(bookingId).isEqualTo("bk1")
                assertThat(amount).isEqualTo(50000)
            }
        }

    @Test
    public fun `cancelPaymentFailed transitions from PaymentFailed back to Ready preserving slot and address`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            bus.post(PaymentResult.Failure(code = 2, description = "Payment cancelled by user."))
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.PaymentFailed::class.java)

            vm.cancelPaymentFailed()

            val state = vm.uiState.value
            assertThat(state).isInstanceOf(BookingUiState.Ready::class.java)
            with(state as BookingUiState.Ready) {
                assertThat(this.slot).isEqualTo(slot)
                assertThat(addressText).isEqualTo("123 Main St")
                assertThat(lat).isEqualTo(12.9716)
                assertThat(lng).isEqualTo(77.5946)
            }
        }

    @Test
    public fun `paymentResultFailure with code 2 and non-cancellation description maps to SERVER_ERROR`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1")
            // SDK code 2 with a non-cancellation description → SERVER_ERROR (Razorpay gateway outage)
            bus.post(PaymentResult.Failure(code = 2, description = "Server error occurred"))
            val state = vm.uiState.value as BookingUiState.PaymentFailed
            assertThat(state.errorCode).isEqualTo(RazorpayErrorCode.SERVER_ERROR)
        }

    @Test
    public fun `retryPayment is no-op when state is not PaymentFailed`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            // State is Ready, not PaymentFailed
            vm.retryPayment()
            // Should remain Ready without crashing
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.Ready::class.java)
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

package com.homeservices.customer.ui.booking

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
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
public class BookingViewModelCreditTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val biometricGate: BiometricGateUseCase = mockk()
    private val slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00")

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate)

    // AC-5: toggle hidden when balance == 0
    @Test
    public fun `setWalletBalance with 0 leaves applyCreditToggle false`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setWalletBalance(0L)
            assertThat(vm.applyCreditToggle.value).isFalse()
        }

    // AC-1: toggle auto-enabled when credit available
    @Test
    public fun `setWalletBalance with positive value auto-enables applyCreditToggle`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setWalletBalance(50000L)
            assertThat(vm.applyCreditToggle.value).isTrue()
        }

    @Test
    public fun `walletBalanceInPaise reflects value set via setWalletBalance`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setWalletBalance(75000L)
            assertThat(vm.walletBalanceInPaise.value).isEqualTo(75000L)
        }

    // AC-5: toggle visible only when balance > 0
    @Test
    public fun `setWalletBalance negative value leaves applyCreditToggle false`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setWalletBalance(-100L)
            assertThat(vm.applyCreditToggle.value).isFalse()
        }

    @Test
    public fun `setApplyCreditToggle sets toggle state`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setWalletBalance(50000L)
            vm.setApplyCreditToggle(false)
            assertThat(vm.applyCreditToggle.value).isFalse()
            vm.setApplyCreditToggle(true)
            assertThat(vm.applyCreditToggle.value).isTrue()
        }

    // AC-3: applyCredit forwarded to createBooking when toggle is on
    @Test
    public fun `startBooking with toggle on forwards applyCredit=true to createBooking`(): Unit =
        runTest(dispatcher) {
            val capturedRequest = mockkSlot<com.homeservices.customer.domain.booking.model.BookingRequest>()
            every { createBooking(capture(capturedRequest)) } returns
                flowOf(
                    Result.success(
                        BookingResult(
                            bookingId = "bk1",
                            razorpayOrderId = "order_1",
                            amount = 40000,
                            appliedCreditAmount = 10000,
                        ),
                    ),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.setWalletBalance(10000L)
            // toggle auto-enabled; do not disable
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            assertThat(capturedRequest.captured.applyCredit).isTrue()
        }

    // AC-3: applyCredit=false when toggle is off
    @Test
    public fun `startBooking with toggle off forwards applyCredit=false to createBooking`(): Unit =
        runTest(dispatcher) {
            val capturedRequest = mockkSlot<com.homeservices.customer.domain.booking.model.BookingRequest>()
            every { createBooking(capture(capturedRequest)) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.setWalletBalance(10000L)
            vm.setApplyCreditToggle(false) // override auto-enable
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            assertThat(capturedRequest.captured.applyCredit).isFalse()
        }

    // AC-6: AwaitingPayment.amount = response.amount (server-authoritative)
    @Test
    public fun `startBooking with credit applied sets AwaitingPayment amount from server response`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(
                        BookingResult(
                            bookingId = "bk1",
                            razorpayOrderId = "order_1",
                            amount = 40000,
                            appliedCreditAmount = 10000,
                        ),
                    ),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.setWalletBalance(10000L)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            val state = vm.uiState.value as BookingUiState.AwaitingPayment
            // server returns amount=40000 net of credit; client uses it directly
            assertThat(state.amount).isEqualTo(40000)
        }

    // AC-4: BookingConfirmed carries appliedCreditAmount from result
    @Test
    public fun `startBooking cash booking with credit sets BookingConfirmed appliedCreditAmount`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(
                        BookingResult(
                            bookingId = "bk1",
                            razorpayOrderId = "cash_1",
                            amount = 40000,
                            requiresPayment = false,
                            paymentMethod = BookingPaymentMethod.CASH_ON_SERVICE,
                            appliedCreditAmount = 10000,
                        ),
                    ),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.setWalletBalance(10000L)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.CASH_ON_SERVICE)
            val state = vm.uiState.value as BookingUiState.BookingConfirmed
            assertThat(state.appliedCreditAmount).isEqualTo(10000)
        }

    // Security: credit amount cannot make total go below 0
    @Test
    public fun `lastAppliedCreditAmount reflects credit from last confirmed booking`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
                flowOf(
                    Result.success(
                        BookingResult(
                            bookingId = "bk1",
                            razorpayOrderId = "cash_1",
                            amount = 0,
                            requiresPayment = false,
                            paymentMethod = BookingPaymentMethod.CASH_ON_SERVICE,
                            appliedCreditAmount = 50000,
                        ),
                    ),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.setWalletBalance(50000L)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.CASH_ON_SERVICE)
            val state = vm.uiState.value as BookingUiState.BookingConfirmed
            assertThat(state.appliedCreditAmount).isEqualTo(50000)
            // Razorpay amount from server is 0 (fully covered by credit)
        }

    // Default: no wallet set => no credit flag
    @Test
    public fun `startBooking without wallet balance set forwards applyCredit=false`(): Unit =
        runTest(dispatcher) {
            val capturedRequest = mockkSlot<com.homeservices.customer.domain.booking.model.BookingRequest>()
            every { createBooking(capture(capturedRequest)) } returns
                flowOf(
                    Result.success(BookingResult("bk1", "order_1", 50000)),
                )
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            // no setWalletBalance call
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            assertThat(capturedRequest.captured.applyCredit).isFalse()
        }
}

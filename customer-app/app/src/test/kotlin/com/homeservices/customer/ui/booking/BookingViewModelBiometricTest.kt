package com.homeservices.customer.ui.booking

import androidx.fragment.app.FragmentActivity
import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.auth.model.BiometricResult
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import io.mockk.coEvery
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

/**
 * TDD tests for biometric gate injection into BookingViewModel.
 *
 * Invariants verified:
 * 1. Gate fires on online-payment (Razorpay) path when hardware present.
 * 2. Biometric Cancelled blocks the online-payment path.
 * 3. Cash/wallet path does NOT invoke the biometric gate.
 * 4. HardwareAbsent on Razorpay path proceeds without gating.
 * 5. Null activity on Razorpay path fails closed.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class BookingViewModelBiometricTest {
    private val dispatcher = UnconfinedTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val biometricGate: BiometricGateUseCase = mockk()
    private val activity: FragmentActivity = mockk(relaxed = true)
    private val slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00")

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun makeVm() = BookingViewModel(createBooking, confirmBooking, razorpayPayment, biometricGate, NoOpAnalyticsFacade())

    // ------------------------------------------------------------------
    // 1. Online-payment (Razorpay) path — biometric fires and proceeds on Authenticated
    // ------------------------------------------------------------------

    @Test
    public fun `startPayment with Authenticated biometric transitions to AwaitingPayment`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Authenticated
            every { createBooking(any()) } returns
                flowOf(Result.success(BookingResult("bk1", "order_1", 50000)))

            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1", activity)

            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.AwaitingPayment::class.java)
        }

    // ------------------------------------------------------------------
    // 2. Online-payment path — Cancelled biometric blocks progression
    // ------------------------------------------------------------------

    @Test
    public fun `startPayment with Cancelled biometric stays in Ready state`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Cancelled

            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1", activity)

            // Must stay in Ready — payment must NOT be initiated
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.Ready::class.java)
        }

    // ------------------------------------------------------------------
    // 3. Cash path does NOT gate with biometric
    // ------------------------------------------------------------------

    @Test
    public fun `startBooking with cash skips biometric gate entirely`(): Unit =
        runTest(dispatcher) {
            every { createBooking(any()) } returns
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
            // Cash booking uses startBooking directly (no activity parameter)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.CASH_ON_SERVICE)

            // biometricGate should NEVER be called — if it were, mockk would throw (strict mock)
            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.BookingConfirmed::class.java)
        }

    // ------------------------------------------------------------------
    // 4. HardwareAbsent on Razorpay path — proceeds without biometric
    // ------------------------------------------------------------------

    @Test
    public fun `startPayment proceeds without biometric when HardwareAbsent`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns false
            every { createBooking(any()) } returns
                flowOf(Result.success(BookingResult("bk1", "order_1", 50000)))

            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1", activity)

            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.AwaitingPayment::class.java)
        }

    // ------------------------------------------------------------------
    // 5. Null activity on Razorpay path fails closed
    // ------------------------------------------------------------------

    @Test
    public fun `startPayment with null activity fails closed — stays in Ready`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1", null)

            // Must NOT advance to AwaitingPayment
            assertThat(vm.uiState.value).isNotInstanceOf(BookingUiState.AwaitingPayment::class.java)
        }

    // ------------------------------------------------------------------
    // 6. Lockout on Razorpay path also blocks
    // ------------------------------------------------------------------

    @Test
    public fun `startPayment with Lockout biometric stays in Ready state`(): Unit =
        runTest(dispatcher) {
            every { biometricGate.canUseBiometric(activity) } returns true
            coEvery {
                biometricGate.requestAuth(activity, any(), any())
            } returns BiometricResult.Lockout

            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)
            vm.startPayment("svc1", "cat1", activity)

            assertThat(vm.uiState.value).isInstanceOf(BookingUiState.Ready::class.java)
        }
}

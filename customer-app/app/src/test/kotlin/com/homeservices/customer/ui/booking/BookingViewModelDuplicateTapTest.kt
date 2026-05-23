package com.homeservices.customer.ui.booking

import com.homeservices.customer.data.booking.PaymentResultBus
import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.auth.BiometricGateUseCase
import com.homeservices.customer.domain.booking.ConfirmBookingUseCase
import com.homeservices.customer.domain.booking.CreateBookingUseCase
import com.homeservices.customer.domain.booking.RazorpayPaymentUseCase
import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.BookingSlot
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * Regression tests for PRD-03: Pay Now duplicate-tap guard.
 *
 * Uses [StandardTestDispatcher] (NOT [kotlinx.coroutines.test.UnconfinedTestDispatcher]) so
 * coroutines launched inside [BookingViewModel.startBooking] are queued and do not execute
 * until the test scheduler is advanced. This is what makes the race window observable in
 * a test: a second tap landing before the first coroutine body has run.
 */
@OptIn(ExperimentalCoroutinesApi::class)
public class BookingViewModelDuplicateTapTest {
    private val dispatcher = StandardTestDispatcher()
    private val bus = PaymentResultBus()
    private val createBooking: CreateBookingUseCase = mockk()
    private val confirmBooking: ConfirmBookingUseCase = mockk()
    private val razorpayPayment = RazorpayPaymentUseCase(bus)
    private val biometricGate: BiometricGateUseCase = mockk()
    private val catalogueRepository: CatalogueRepository = mockk()
    private val slot = BookingSlot(date = "2026-05-01", window = "10:00-12:00")

    @Before
    public fun setUp(): Unit {
        Dispatchers.setMain(dispatcher)
        every { biometricGate.canUseBiometric(any()) } returns false
        every { catalogueRepository.getCategories() } returns flowOf(Result.success(emptyList()))
        every { createBooking(any<BookingRequest>()) } returns
            flowOf(
                Result.success(BookingResult(bookingId = "bk1", razorpayOrderId = "order_1", amount = 50000)),
            )
    }

    @After
    public fun tearDown(): Unit {
        Dispatchers.resetMain()
    }

    private fun makeVm() =
        BookingViewModel(
            createBooking,
            confirmBooking,
            razorpayPayment,
            biometricGate,
            NoOpAnalyticsFacade(),
            catalogueRepository,
        )

    @Test
    public fun `startBooking called twice rapidly produces exactly one createBooking invocation`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)

            // Back-to-back invocations with no scheduler advance between them. With the bug
            // present, both calls see Ready and each launches a coroutine that calls
            // createBooking, producing duplicate bookings + Razorpay orders server-side.
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)

            advanceUntilIdle()

            coVerify(exactly = 1) { createBooking(any()) }
        }

    @Test
    public fun `second startBooking call while in CreatingBooking state is a no-op`(): Unit =
        runTest(dispatcher) {
            val vm = makeVm()
            vm.setSlotAndAddress(slot, "123 Main St", 12.9716, 77.5946)

            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            // Run only what is currently queued. With the fix, this drains the synchronous
            // state transition into CreatingBooking. The pending launch body has not
            // necessarily completed, but the public state has moved off Ready.
            runCurrent()

            vm.startBooking("svc1", "cat1", BookingPaymentMethod.RAZORPAY)
            advanceUntilIdle()

            coVerify(exactly = 1) { createBooking(any()) }
        }
}

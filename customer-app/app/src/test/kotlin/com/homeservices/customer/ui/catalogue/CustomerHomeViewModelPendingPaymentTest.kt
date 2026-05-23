package com.homeservices.customer.ui.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.pendingaction.PendingActionStore
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

    private val authStateFlow =
        MutableStateFlow<AuthState>(
            AuthState.Authenticated(uid = "uid1"),
        )

    private fun makeBooking(
        id: String,
        status: CustomerBookingStatus,
        orderId: String? = null,
    ) = CustomerBooking(
        bookingId = id,
        serviceId = "svc1",
        serviceName = "AC",
        addressText = "Addr",
        status = status,
        slotDate = "2026-06-01",
        slotWindow = "10:00-12:00",
        amountPaise = 59900,
        paymentMethod = BookingPaymentMethod.RAZORPAY,
        createdAt = "2026-06-01T10:00:00Z",
        razorpayOrderId = orderId,
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

    @Test
    public fun `unauthenticated authState keeps state as Loading`(): Unit =
        runTest(dispatcher) {
            authStateFlow.value = AuthState.Unauthenticated
            val vm = CustomerHomeViewModel(pendingActionStore, bookingRepository, sessionManager)
            assertThat(vm.homeUiState.value).isInstanceOf(CustomerHomeUiState.Loading::class.java)
        }

    @Test
    public fun `booking repository failure yields null pendingPaymentBooking`(): Unit =
        runTest(dispatcher) {
            every { bookingRepository.getMyBookings() } returns
                flowOf(Result.failure(RuntimeException("network")))
            val vm = CustomerHomeViewModel(pendingActionStore, bookingRepository, sessionManager)
            val state = vm.homeUiState.value as? CustomerHomeUiState.Ready
            assertThat(state!!.pendingPaymentBooking).isNull()
        }
}

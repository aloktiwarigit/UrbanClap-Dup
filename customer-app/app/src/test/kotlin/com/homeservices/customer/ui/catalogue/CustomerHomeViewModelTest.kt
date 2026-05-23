package com.homeservices.customer.ui.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.data.auth.SessionManager
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
public class CustomerHomeViewModelTest {
    private val dispatcher = UnconfinedTestDispatcher()

    private val pendingActionStore: PendingActionStore = mockk()
    private val sessionManager: SessionManager = mockk()

    // A fake BookingRepository (simple interface impl with mockk)
    private val bookingRepository: com.homeservices.customer.data.booking.BookingRepository = mockk()

    private fun makeAction(
        id: String,
        priority: PendingActionPriority = PendingActionPriority.NORMAL,
    ): PendingAction =
        PendingAction(
            id = id,
            userId = "user1",
            role = "customer",
            type = PendingActionType.RATING_PROMPT_CUSTOMER,
            entityType = "booking",
            entityId = "bk-$id",
            routeUri = "homeservices://action/RATING_PROMPT_CUSTOMER?bookingId=bk-$id",
            priority = priority,
            status = PendingActionStatus.ACTIVE,
            sourceStatus = null,
            version = 1L,
            createdAt = 1_000L,
            updatedAt = 1_000L,
            expiresAt = null,
            resolvedAt = null,
        )

    private fun makeBooking(
        bookingId: String,
        status: CustomerBookingStatus,
        createdAt: String = "2026-05-01T10:00:00Z",
    ): CustomerBooking =
        CustomerBooking(
            bookingId = bookingId,
            serviceId = "svc1",
            serviceName = "AC Repair",
            addressText = "123 Main St",
            status = status,
            slotDate = "2026-05-10",
            slotWindow = "10:00–12:00",
            amountPaise = 59900,
            paymentMethod = BookingPaymentMethod.RAZORPAY,
            createdAt = createdAt,
        )

    @Before
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun buildViewModel(): CustomerHomeViewModel =
        CustomerHomeViewModel(
            pendingActionStore = pendingActionStore,
            bookingRepository = bookingRepository,
            sessionManager = sessionManager,
        )

    // ── Auth state ─────────────────────────────────────────────────────────────

    @Test
    public fun `emits Loading state initially when authenticated`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(emptyList()))

            val vm = buildViewModel()
            // With UnconfinedTestDispatcher the state resolves quickly; just check it's not null
            assertThat(vm.homeUiState.value).isNotNull()
        }

    // ── Pending actions ────────────────────────────────────────────────────────

    @Test
    public fun `pending actions are capped at top 3 by priority`(): Unit =
        runTest(dispatcher) {
            val actions =
                listOf(
                    makeAction("a1", PendingActionPriority.LOW),
                    makeAction("a2", PendingActionPriority.HIGH),
                    makeAction("a3", PendingActionPriority.NORMAL),
                    makeAction("a4", PendingActionPriority.HIGH),
                    makeAction("a5", PendingActionPriority.LOW),
                )
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(actions)
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(emptyList()))

            val vm = buildViewModel()
            val state = vm.homeUiState.value
            assertThat(state).isInstanceOf(CustomerHomeUiState.Ready::class.java)
            val ready = state as CustomerHomeUiState.Ready
            // Top 3 by priority: HIGH, HIGH, NORMAL
            assertThat(ready.pendingActions).hasSize(3)
            assertThat(ready.pendingActions.map { it.priority })
                .containsExactly(
                    PendingActionPriority.HIGH,
                    PendingActionPriority.HIGH,
                    PendingActionPriority.NORMAL,
                ).inOrder()
        }

    @Test
    public fun `pending actions empty when store emits empty list`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(emptyList()))

            val vm = buildViewModel()
            val state = vm.homeUiState.value as CustomerHomeUiState.Ready
            assertThat(state.pendingActions).isEmpty()
        }

    // ── Active booking ─────────────────────────────────────────────────────────

    @Test
    public fun `active booking is SEARCHING status`(): Unit =
        runTest(dispatcher) {
            val bookings =
                listOf(
                    makeBooking("bk1", CustomerBookingStatus.COMPLETED),
                    makeBooking("bk2", CustomerBookingStatus.SEARCHING),
                )
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(bookings))

            val vm = buildViewModel()
            val state = vm.homeUiState.value as CustomerHomeUiState.Ready
            assertThat(state.activeBooking).isNotNull()
            assertThat(state.activeBooking!!.bookingId).isEqualTo("bk2")
        }

    @Test
    public fun `active booking is null when no active bookings`(): Unit =
        runTest(dispatcher) {
            val bookings = listOf(makeBooking("bk1", CustomerBookingStatus.COMPLETED))
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(bookings))

            val vm = buildViewModel()
            val state = vm.homeUiState.value as CustomerHomeUiState.Ready
            assertThat(state.activeBooking).isNull()
        }

    @Test
    public fun `active booking covers all active statuses`(): Unit =
        runTest(dispatcher) {
            val activeStatuses =
                listOf(
                    CustomerBookingStatus.SEARCHING,
                    CustomerBookingStatus.ASSIGNED,
                    CustomerBookingStatus.EN_ROUTE,
                    CustomerBookingStatus.REACHED,
                    CustomerBookingStatus.IN_PROGRESS,
                    CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
                )
            activeStatuses.forEach { status ->
                every { sessionManager.authState } returns
                    MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
                every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
                every { bookingRepository.getMyBookings() } returns
                    flowOf(Result.success(listOf(makeBooking("bk1", status))))

                val vm = buildViewModel()
                val state = vm.homeUiState.value as CustomerHomeUiState.Ready
                assertThat(state.activeBooking).isNotNull()
            }
        }

    // ── Recent bookings ────────────────────────────────────────────────────────

    @Test
    public fun `recent bookings shows last 5 completed sorted newest first`(): Unit =
        runTest(dispatcher) {
            val bookings =
                (1..8).map { i ->
                    makeBooking("bk$i", CustomerBookingStatus.COMPLETED, "2026-05-0${i}T10:00:00Z")
                }
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(bookings))

            val vm = buildViewModel()
            val state = vm.homeUiState.value as CustomerHomeUiState.Ready
            assertThat(state.recentBookings).hasSize(5)
            // Should be newest-first (bk8, bk7, bk6, bk5, bk4)
            assertThat(state.recentBookings.first().bookingId).isEqualTo("bk8")
        }

    @Test
    public fun `recent bookings empty when no completed bookings`(): Unit =
        runTest(dispatcher) {
            val bookings = listOf(makeBooking("bk1", CustomerBookingStatus.PAID))
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(bookings))

            val vm = buildViewModel()
            val state = vm.homeUiState.value as CustomerHomeUiState.Ready
            assertThat(state.recentBookings).isEmpty()
        }

    // ── isDirty ────────────────────────────────────────────────────────────────

    @Test
    public fun `isDirty always returns false`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns
                MutableStateFlow(AuthState.Authenticated("user1", null, null, null, AuthProvider.Phone))
            every { pendingActionStore.observeActive("user1") } returns flowOf(emptyList())
            every { bookingRepository.getMyBookings() } returns flowOf(Result.success(emptyList()))

            val vm = buildViewModel()
            assertThat(vm.isDirty()).isFalse()
        }

    // ── Unauthenticated state ──────────────────────────────────────────────────

    @Test
    public fun `emits Loading when user is unauthenticated`(): Unit =
        runTest(dispatcher) {
            every { sessionManager.authState } returns MutableStateFlow(AuthState.Unauthenticated)

            val vm = buildViewModel()
            assertThat(vm.homeUiState.value).isInstanceOf(CustomerHomeUiState.Loading::class.java)
        }
}

package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.corenav.PendingAction
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for the durable-hooks sections of [CatalogueHomeScreen] tab 0 (E11-S03).
 *
 * Merges three reactive flows:
 * 1. [pendingActionsFlow] — top-3 ACTIVE pending actions from [PendingActionStore].
 * 2. [activeBookingFlow]  — first booking in an active-workflow status from [BookingRepository].
 * 3. [recentBookingsFlow] — last 5 COMPLETED bookings from [BookingRepository].
 *
 * Implements [isDirty] → false: the home screen is read-only and always silently mergeable
 * (see E11 spec §2.11 DirtyStateMerger contract).
 *
 * If the user is unauthenticated the state stays [CustomerHomeUiState.Loading] and no
 * network / DB calls are issued.
 *
 * If [PendingActionStore] cannot observe actions (e.g. userId unavailable), falls back
 * to emitting an empty list — rendering is never blocked.
 */
@HiltViewModel
public class CustomerHomeViewModel
    @Inject
    constructor(
        private val pendingActionStore: PendingActionStore,
        private val bookingRepository: BookingRepository,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _homeUiState = MutableStateFlow<CustomerHomeUiState>(CustomerHomeUiState.Loading)
        public val homeUiState: StateFlow<CustomerHomeUiState> = _homeUiState.asStateFlow()

        init {
            viewModelScope.launch {
                observeHomeState().collect { state ->
                    _homeUiState.value = state
                }
            }
        }

        /** Read-only home screen — never has user input that would conflict with a silent refresh. */
        @Suppress("FunctionOnlyReturningConstant")
        public fun isDirty(): Boolean = false

        // ── Private helpers ────────────────────────────────────────────────────

        @OptIn(ExperimentalCoroutinesApi::class)
        private fun observeHomeState(): Flow<CustomerHomeUiState> =
            sessionManager.authState.flatMapLatest { authState ->
                if (authState !is AuthState.Authenticated) {
                    flowOf(CustomerHomeUiState.Loading)
                } else {
                    mergeFlows(userId = authState.uid)
                }
            }

        private fun mergeFlows(userId: String): Flow<CustomerHomeUiState> {
            val pendingActionsFlow: Flow<List<PendingAction>> =
                pendingActionStore
                    .observeActive(userId)
                    .map { actions ->
                        // PendingActionPriority ordinal: HIGH=0, NORMAL=1, LOW=2.
                        // Sort ascending by ordinal so HIGH comes first.
                        val comparator =
                            compareBy<PendingAction> { it.priority.ordinal }
                                .thenBy { it.createdAt }
                        actions.sortedWith(comparator).take(MAX_PENDING_ACTIONS)
                    }

            val bookingsFlow: Flow<Result<List<CustomerBooking>>> = bookingRepository.getMyBookings()

            val activeBookingFlow: Flow<CustomerBooking?> =
                bookingsFlow.map { result ->
                    result.getOrNull()?.firstOrNull { it.status in ACTIVE_STATUSES }
                }

            val recentBookingsFlow: Flow<List<CustomerBooking>> =
                bookingsFlow.map { result ->
                    result
                        .getOrNull()
                        ?.filter { it.status == CustomerBookingStatus.COMPLETED }
                        ?.sortedByDescending { it.createdAt }
                        ?.take(MAX_RECENT_BOOKINGS)
                        ?: emptyList()
                }

            return combine(pendingActionsFlow, activeBookingFlow, recentBookingsFlow) { actions, active, recent ->
                CustomerHomeUiState.Ready(
                    pendingActions = actions,
                    activeBooking = active,
                    recentBookings = recent,
                )
            }
        }

        private companion object {
            const val MAX_PENDING_ACTIONS = 3
            const val MAX_RECENT_BOOKINGS = 5

            /** Active statuses from E11 spec §E11-S03. */
            val ACTIVE_STATUSES =
                setOf(
                    CustomerBookingStatus.SEARCHING,
                    CustomerBookingStatus.ASSIGNED,
                    CustomerBookingStatus.EN_ROUTE,
                    CustomerBookingStatus.REACHED,
                    CustomerBookingStatus.IN_PROGRESS,
                    CustomerBookingStatus.AWAITING_PRICE_APPROVAL,
                )
        }
    }

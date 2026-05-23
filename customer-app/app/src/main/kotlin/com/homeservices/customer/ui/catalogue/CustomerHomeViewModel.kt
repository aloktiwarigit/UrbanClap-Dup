package com.homeservices.customer.ui.catalogue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.auth.SessionManager
import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.data.pendingaction.PendingActionStore
import com.homeservices.customer.domain.auth.model.AuthState
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
internal class CustomerHomeViewModel
    @Inject
    constructor(
        private val pendingActionStore: PendingActionStore,
        private val bookingRepository: BookingRepository,
        private val sessionManager: SessionManager,
    ) : ViewModel() {
        private val _homeUiState = MutableStateFlow<CustomerHomeUiState>(CustomerHomeUiState.Loading)
        public val homeUiState: StateFlow<CustomerHomeUiState> = _homeUiState.asStateFlow()

        public fun cancelPendingBooking(bookingId: String) {
            viewModelScope.launch {
                bookingRepository.cancelBooking(bookingId)
            }
        }

        init {
            viewModelScope.launch {
                sessionManager.authState
                    .flatMapLatest { authState ->
                        when (authState) {
                            is AuthState.Authenticated ->
                                combine(
                                    bookingRepository.getMyBookings(),
                                    pendingActionStore.observeActive(authState.uid),
                                ) { bookingsResult, _ ->
                                    val pendingPayment =
                                        bookingsResult
                                            .getOrNull()
                                            ?.firstOrNull { it.status == CustomerBookingStatus.PENDING_PAYMENT }
                                    CustomerHomeUiState.Ready(pendingPaymentBooking = pendingPayment)
                                }
                            else -> flowOf(CustomerHomeUiState.Loading)
                        }
                    }.collect { _homeUiState.value = it }
            }
        }
    }

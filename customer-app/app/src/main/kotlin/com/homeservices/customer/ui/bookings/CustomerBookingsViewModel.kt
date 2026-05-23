package com.homeservices.customer.ui.bookings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.domain.booking.GetCustomerBookingsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class CustomerBookingsViewModel
    @Inject
    constructor(
        private val getBookings: GetCustomerBookingsUseCase,
    ) : ViewModel() {
        private val uiStateMutable = MutableStateFlow<CustomerBookingsUiState>(CustomerBookingsUiState.Loading)
        internal val uiState: StateFlow<CustomerBookingsUiState> = uiStateMutable.asStateFlow()

        init {
            refresh()
        }

        public fun refresh() {
            viewModelScope.launch {
                uiStateMutable.value = CustomerBookingsUiState.Loading
                uiStateMutable.value =
                    getBookings()
                        .first()
                        .fold(
                            onSuccess = { CustomerBookingsUiState.Ready(it) },
                            onFailure = { CustomerBookingsUiState.Error },
                        )
            }
        }
    }

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
        private val _uiState = MutableStateFlow<CustomerBookingsUiState>(CustomerBookingsUiState.Loading)
        val uiState: StateFlow<CustomerBookingsUiState> = _uiState.asStateFlow()

        init {
            refresh()
        }

        fun refresh() {
            viewModelScope.launch {
                _uiState.value = CustomerBookingsUiState.Loading
                _uiState.value =
                    getBookings()
                        .first()
                        .fold(
                            onSuccess = { CustomerBookingsUiState.Ready(it) },
                            onFailure = { CustomerBookingsUiState.Error },
                        )
            }
        }
    }

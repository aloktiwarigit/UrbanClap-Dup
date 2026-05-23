package com.homeservices.customer.ui.bookings

import com.homeservices.customer.domain.booking.model.CustomerBooking

internal sealed class CustomerBookingsUiState {
    data object Loading : CustomerBookingsUiState()

    data class Ready(
        val bookings: List<CustomerBooking>,
    ) : CustomerBookingsUiState()

    data object Error : CustomerBookingsUiState()
}

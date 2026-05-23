package com.homeservices.customer.ui.catalogue

import com.homeservices.customer.domain.booking.model.CustomerBooking

public sealed class CustomerHomeUiState {
    public data object Loading : CustomerHomeUiState()

    public data class Ready(
        public val pendingPaymentBooking: CustomerBooking? = null,
    ) : CustomerHomeUiState()

    public data class Error(
        public val message: String,
    ) : CustomerHomeUiState()
}

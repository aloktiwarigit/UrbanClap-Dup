package com.homeservices.customer.ui.booking

import com.homeservices.customer.domain.booking.model.BookingSlot

public sealed class BookingUiState {
    public object Idle : BookingUiState()

    public data class Ready(
        val slot: BookingSlot,
        val addressText: String,
        val lat: Double,
        val lng: Double,
    ) : BookingUiState()

    public object CreatingBooking : BookingUiState()

    public data class AwaitingPayment(
        val bookingId: String,
        val razorpayOrderId: String,
        val amount: Int,
    ) : BookingUiState()

    public object ConfirmingPayment : BookingUiState()

    public data class BookingConfirmed(
        val bookingId: String,
    ) : BookingUiState()

    public data class Error(
        val message: String,
    ) : BookingUiState()
}

package com.homeservices.customer.ui.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import com.homeservices.customer.domain.tracking.model.LiveLocation

public sealed class LiveTrackingUiState {
    public object Loading : LiveTrackingUiState()

    public data class Tracking(
        val bookingId: String,
        val location: LiveLocation?,
        val status: BookingStatus,
        val techName: String,
        val techPhotoUrl: String,
        val etaMinutes: Int?,
    ) : LiveTrackingUiState()
}

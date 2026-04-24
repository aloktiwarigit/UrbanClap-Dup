package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.TrackingState
import kotlinx.coroutines.flow.Flow

public interface TrackingRepository {
    public fun trackBooking(bookingId: String): Flow<TrackingState>
}

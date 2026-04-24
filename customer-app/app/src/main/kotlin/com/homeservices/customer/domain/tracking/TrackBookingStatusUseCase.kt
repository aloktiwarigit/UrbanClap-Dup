package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.BookingStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

public class TrackBookingStatusUseCase
    @Inject
    constructor(
        private val repository: TrackingRepository,
    ) {
        public fun execute(bookingId: String): Flow<BookingStatus> = repository.trackBooking(bookingId).map { it.status }
    }

package com.homeservices.customer.domain.tracking

import com.homeservices.customer.domain.tracking.model.LiveLocation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

public class GetLiveLocationUseCase
    @Inject
    constructor(
        private val repository: TrackingRepository,
    ) {
        public fun execute(bookingId: String): Flow<LiveLocation?> = repository.trackBooking(bookingId).map { it.location }
    }

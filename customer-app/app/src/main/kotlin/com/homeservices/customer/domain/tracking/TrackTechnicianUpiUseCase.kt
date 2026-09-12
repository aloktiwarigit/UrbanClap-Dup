package com.homeservices.customer.domain.tracking

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

public class TrackTechnicianUpiUseCase
    @Inject
    constructor(
        private val repository: TrackingRepository,
    ) {
        public fun execute(bookingId: String): Flow<String?> =
            repository.trackBooking(bookingId).map { it.technicianUpiMasked }
    }

package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class ConfirmBookingUseCase
    @Inject
    constructor(
        private val repo: BookingRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            paymentId: String,
            orderId: String,
            signature: String,
        ): Flow<Result<String>> = repo.confirmBooking(bookingId, paymentId, orderId, signature)
    }

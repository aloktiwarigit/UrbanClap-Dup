package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import javax.inject.Inject

public class CancelPendingBookingUseCase
    @Inject
    constructor(
        private val bookingRepository: BookingRepository,
    ) {
        public suspend operator fun invoke(bookingId: String): Result<Unit> = bookingRepository.cancelBooking(bookingId)
    }

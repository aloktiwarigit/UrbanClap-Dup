package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class CreateBookingUseCase
    @Inject
    constructor(
        private val repo: BookingRepository,
    ) {
        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> = repo.createBooking(request)
    }

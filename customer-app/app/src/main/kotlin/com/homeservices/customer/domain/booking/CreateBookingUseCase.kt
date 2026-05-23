package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject

public class CreateBookingUseCase
    @Inject
    constructor(
        private val repo: BookingRepository,
    ) {
        public operator fun invoke(request: BookingRequest): Flow<Result<BookingResult>> {
            val idempotencyKey = UUID.randomUUID().toString()
            return repo.createBooking(request, idempotencyKey)
        }
    }

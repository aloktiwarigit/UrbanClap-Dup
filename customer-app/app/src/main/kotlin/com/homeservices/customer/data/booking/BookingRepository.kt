package com.homeservices.customer.data.booking

import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import kotlinx.coroutines.flow.Flow

public interface BookingRepository {
    public fun createBooking(request: BookingRequest): Flow<Result<BookingResult>>

    public fun confirmBooking(
        bookingId: String,
        paymentId: String,
        orderId: String,
        signature: String,
    ): Flow<Result<String>>
}

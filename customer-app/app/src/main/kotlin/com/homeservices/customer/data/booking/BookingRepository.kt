package com.homeservices.customer.data.booking

import com.homeservices.customer.domain.booking.model.AddOnDecision
import com.homeservices.customer.domain.booking.model.BookingRequest
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.PendingAddOn
import kotlinx.coroutines.flow.Flow

public interface BookingRepository {
    public fun createBooking(request: BookingRequest): Flow<Result<BookingResult>>

    public fun confirmBooking(
        bookingId: String,
        paymentId: String,
        orderId: String,
        signature: String,
    ): Flow<Result<String>>

    public fun getBooking(bookingId: String): Flow<Result<List<PendingAddOn>>>

    public fun approveFinalPrice(bookingId: String, decisions: List<AddOnDecision>): Flow<Result<Int>>
}

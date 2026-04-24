package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.AddOnDecision
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class ApproveFinalPriceUseCase @Inject constructor(private val repo: BookingRepository) {
    public operator fun invoke(bookingId: String, decisions: List<AddOnDecision>): Flow<Result<Int>> =
        repo.approveFinalPrice(bookingId, decisions)
}

package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.PendingAddOn
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetPendingAddOnsUseCase @Inject constructor(private val repo: BookingRepository) {
    public operator fun invoke(bookingId: String): Flow<Result<List<PendingAddOn>>> =
        repo.getPendingAddOns(bookingId)
}

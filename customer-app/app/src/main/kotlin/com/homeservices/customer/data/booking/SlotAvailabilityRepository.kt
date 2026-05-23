package com.homeservices.customer.data.booking

import com.homeservices.customer.domain.booking.model.SlotWindow
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

public interface SlotAvailabilityRepository {
    public fun getAvailability(
        serviceId: String,
        date: LocalDate,
    ): Flow<Result<List<SlotWindow>>>
}

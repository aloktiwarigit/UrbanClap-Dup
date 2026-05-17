package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.SlotAvailabilityRepository
import com.homeservices.customer.domain.booking.model.SlotWindow
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import javax.inject.Inject

public class GetSlotAvailabilityUseCase
    @Inject
    public constructor(
        private val repository: SlotAvailabilityRepository,
    ) {
        public operator fun invoke(
            serviceId: String,
            date: LocalDate,
        ): Flow<Result<List<SlotWindow>>> = repository.getAvailability(serviceId, date)
    }

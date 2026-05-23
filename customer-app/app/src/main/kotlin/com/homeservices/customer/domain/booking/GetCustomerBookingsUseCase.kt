package com.homeservices.customer.domain.booking

import com.homeservices.customer.data.booking.BookingRepository
import com.homeservices.customer.domain.booking.model.CustomerBooking
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetCustomerBookingsUseCase
    @Inject
    public constructor(
        private val repository: BookingRepository,
    ) {
        public operator fun invoke(): Flow<Result<List<CustomerBooking>>> = repository.getMyBookings()
    }

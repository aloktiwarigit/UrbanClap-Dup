package com.homeservices.customer.data.booking

import com.homeservices.customer.data.booking.remote.BookingApiService
import com.homeservices.customer.domain.booking.model.SlotWindow
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

internal class SlotAvailabilityRepositoryImpl
    @Inject
    constructor(
        private val api: BookingApiService,
    ) : SlotAvailabilityRepository {
        override fun getAvailability(
            serviceId: String,
            date: LocalDate,
        ): Flow<Result<List<SlotWindow>>> =
            flow {
                emit(
                    runCatching {
                        api
                            .getSlotAvailability(
                                serviceId = serviceId,
                                date = date.format(DateTimeFormatter.ISO_LOCAL_DATE),
                            ).slots
                            .map { it.toDomain() }
                    },
                )
            }
    }

package com.homeservices.technician.data.jobs

import com.homeservices.technician.data.jobs.remote.TechnicianJobsApiService
import com.homeservices.technician.domain.jobs.TechnicianJobsRepository
import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import javax.inject.Inject

public class TechnicianJobsRepositoryImpl
    @Inject
    internal constructor(
        private val apiService: TechnicianJobsApiService,
    ) : TechnicianJobsRepository {
        public override suspend fun getMyBookings(): Result<List<TechnicianBooking>> =
            runCatching {
                apiService.getMyBookings().bookings.map { it.toDomain() }
            }
    }

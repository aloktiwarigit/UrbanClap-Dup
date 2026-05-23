package com.homeservices.technician.domain.jobs

import com.homeservices.technician.domain.jobs.model.TechnicianBooking
import javax.inject.Inject

public class GetTechnicianBookingsUseCase
    @Inject
    public constructor(
        private val repository: TechnicianJobsRepository,
    ) {
        public suspend operator fun invoke(): Result<List<TechnicianBooking>> = repository.getMyBookings()
    }

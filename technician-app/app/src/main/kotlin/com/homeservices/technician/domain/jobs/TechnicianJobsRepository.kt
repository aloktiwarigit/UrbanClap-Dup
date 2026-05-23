package com.homeservices.technician.domain.jobs

import com.homeservices.technician.domain.jobs.model.TechnicianBooking

public interface TechnicianJobsRepository {
    public suspend fun getMyBookings(): Result<List<TechnicianBooking>>
}

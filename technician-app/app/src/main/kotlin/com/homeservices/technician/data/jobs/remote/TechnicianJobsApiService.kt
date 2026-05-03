package com.homeservices.technician.data.jobs.remote

import com.homeservices.technician.data.jobs.remote.dto.TechnicianBookingsResponseDto
import retrofit2.http.GET

internal interface TechnicianJobsApiService {
    @GET("v1/technicians/me/bookings")
    suspend fun getMyBookings(): TechnicianBookingsResponseDto
}

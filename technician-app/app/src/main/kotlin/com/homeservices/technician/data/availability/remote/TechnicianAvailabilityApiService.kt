package com.homeservices.technician.data.availability.remote

import com.homeservices.technician.data.availability.remote.dto.TechnicianAvailabilityDto
import com.homeservices.technician.data.availability.remote.dto.UpdateAvailabilityRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH

internal interface TechnicianAvailabilityApiService {
    @GET("v1/technicians/me/availability")
    suspend fun getAvailability(): TechnicianAvailabilityDto

    @PATCH("v1/technicians/me/availability")
    suspend fun updateAvailability(
        @Body request: UpdateAvailabilityRequestDto,
    ): TechnicianAvailabilityDto
}

package com.homeservices.customer.data.technician.remote

import com.homeservices.customer.data.technician.remote.dto.TechnicianProfileDto
import retrofit2.http.GET
import retrofit2.http.Path

public interface TechnicianProfileApiService {
    @GET("v1/technicians/{id}/profile")
    public suspend fun getProfile(
        @Path("id") id: String,
    ): TechnicianProfileDto
}

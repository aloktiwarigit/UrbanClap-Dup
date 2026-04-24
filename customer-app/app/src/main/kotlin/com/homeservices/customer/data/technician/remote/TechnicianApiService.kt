package com.homeservices.customer.data.technician.remote

import com.homeservices.customer.data.technician.remote.dto.ConfidenceScoreDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

public interface TechnicianApiService {
    @GET("v1/technicians/{id}/confidence-score")
    public suspend fun getConfidenceScore(
        @Path("id") technicianId: String,
        @Query("lat") lat: Double,
        @Query("lng") lng: Double,
    ): ConfidenceScoreDto
}

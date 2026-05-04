package com.homeservices.technician.data.serviceprofile.remote

import com.homeservices.technician.data.serviceprofile.remote.dto.ServiceProfileDto
import com.homeservices.technician.data.serviceprofile.remote.dto.UpdateServiceProfileRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH

internal interface ServiceProfileApiService {
    @GET("v1/technicians/me/service-profile")
    suspend fun getServiceProfile(): ServiceProfileDto

    @PATCH("v1/technicians/me/service-profile")
    suspend fun saveServiceProfile(
        @Body request: UpdateServiceProfileRequestDto,
    ): ServiceProfileDto
}

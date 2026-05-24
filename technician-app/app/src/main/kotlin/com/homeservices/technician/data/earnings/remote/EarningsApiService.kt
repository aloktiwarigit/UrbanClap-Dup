package com.homeservices.technician.data.earnings.remote

import com.homeservices.technician.data.earnings.remote.dto.EarningsResponseDto
import retrofit2.http.GET

internal interface EarningsApiService {
    @GET("v1/technicians/me/earnings")
    public suspend fun getEarnings(): EarningsResponseDto
}

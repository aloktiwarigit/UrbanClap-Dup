package com.homeservices.technician.data.shield.remote

import com.homeservices.technician.data.shield.remote.dto.RatingAppealRequestDto
import com.homeservices.technician.data.shield.remote.dto.RatingAppealResponseDto
import com.homeservices.technician.data.shield.remote.dto.ShieldReportRequestDto
import com.homeservices.technician.data.shield.remote.dto.ShieldReportResponseDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

public interface ShieldApiService {
    @POST("v1/technicians/me/shield-report")
    public suspend fun fileShieldReport(
        @Body body: ShieldReportRequestDto,
    ): Response<ShieldReportResponseDto>

    @POST("v1/technicians/me/rating-appeal")
    public suspend fun fileRatingAppeal(
        @Body body: RatingAppealRequestDto,
    ): Response<RatingAppealResponseDto>
}

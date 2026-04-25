package com.homeservices.customer.data.rating.remote

import com.homeservices.customer.data.rating.remote.dto.GetRatingResponseDto
import com.homeservices.customer.data.rating.remote.dto.SubmitRatingRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

public interface RatingApiService {
    @POST("v1/ratings")
    public suspend fun submit(
        @Body body: SubmitRatingRequestDto,
    )

    @GET("v1/ratings/{bookingId}")
    public suspend fun get(
        @Path("bookingId") bookingId: String,
    ): GetRatingResponseDto
}

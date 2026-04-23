package com.homeservices.technician.data.photo

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path

internal interface PhotoApiService {
    @POST("v1/technicians/active-job/{bookingId}/photos")
    suspend fun recordPhoto(
        @Header("Authorization") authHeader: String,
        @Path("bookingId") bookingId: String,
        @Body body: RecordPhotoBody,
    ): Response<Unit>
}

internal data class RecordPhotoBody(
    val stage: String,
    val photoUrl: String,
)

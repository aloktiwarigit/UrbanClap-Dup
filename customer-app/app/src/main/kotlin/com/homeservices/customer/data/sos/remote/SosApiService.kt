package com.homeservices.customer.data.sos.remote

import retrofit2.http.POST
import retrofit2.http.Path

public interface SosApiService {
    @POST("v1/sos/{bookingId}")
    public suspend fun triggerSos(
        @Path("bookingId") bookingId: String,
    )
}

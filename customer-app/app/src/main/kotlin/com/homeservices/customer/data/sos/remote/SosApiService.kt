package com.homeservices.customer.data.sos.remote

import com.squareup.moshi.JsonClass
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

@JsonClass(generateAdapter = true)
public data class SosKeyUploadRequest(
    public val keyB64: String,
    public val ivB64: String,
    public val storagePath: String,
)

public interface SosApiService {
    @POST("v1/sos/{bookingId}")
    public suspend fun triggerSos(
        @Path("bookingId") bookingId: String,
    )

    @POST("v1/sos/{incidentId}/key")
    public suspend fun uploadKey(
        @Path("incidentId") incidentId: String,
        @Body body: SosKeyUploadRequest,
    )
}

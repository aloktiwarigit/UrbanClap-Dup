package com.homeservices.customer.data.dataexport.remote

import okhttp3.ResponseBody
import retrofit2.http.GET

/** Retrofit interface for the data-export endpoint (ADR-0012, DPDP §11). */
public interface DataExportApiService {
    /**
     * GET /v1/users/me/data-export
     *
     * Returns a [ResponseBody] containing the raw JSON of the authenticated user's full
     * data export (bookings, profile, ratings, complaints, etc.).
     *
     * [ResponseBody] is used instead of a typed DTO so the JSON can be saved verbatim
     * to a user-selected file via the Storage Access Framework without re-serialising.
     *
     * Auth: Firebase ID-token injected by [IdTokenCache] + [FirebaseTokenAuthenticator].
     */
    @GET("v1/users/me/data-export")
    public suspend fun fetchDataExport(): ResponseBody
}

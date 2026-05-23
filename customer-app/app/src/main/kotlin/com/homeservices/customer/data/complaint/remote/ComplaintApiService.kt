package com.homeservices.customer.data.complaint.remote

import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

public interface ComplaintApiService {
    @POST("v1/complaints")
    public suspend fun createComplaint(
        @Body body: CreateComplaintRequestDto,
    ): ComplaintResponseDto

    @GET("v1/complaints/{bookingId}")
    public suspend fun getComplaintsForBooking(
        @Path("bookingId") bookingId: String,
    ): ComplaintListResponseDto

    @POST("v1/complaints/{id}/reopen")
    public suspend fun reopenComplaint(
        @Path("id") id: String,
    ): ComplaintResponseDto

    @GET("v1/complaints")
    public suspend fun getComplaints(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): ComplaintListResponseDto
}

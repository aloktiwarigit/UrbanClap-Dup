package com.homeservices.customer.data.booking.remote

import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingResponseDto
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

public interface BookingApiService {
    @POST("v1/bookings")
    public suspend fun createBooking(
        @Body body: CreateBookingRequestDto,
    ): CreateBookingResponseDto

    @POST("v1/bookings/{id}/confirm")
    public suspend fun confirmBooking(
        @Path("id") bookingId: String,
        @Body body: ConfirmBookingRequestDto,
    ): ConfirmBookingResponseDto
}

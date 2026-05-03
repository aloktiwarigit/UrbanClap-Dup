package com.homeservices.customer.data.booking.remote

import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceRequestDto
import com.homeservices.customer.data.booking.remote.dto.ApproveFinalPriceResponseDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.ConfirmBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingRequestDto
import com.homeservices.customer.data.booking.remote.dto.CreateBookingResponseDto
import com.homeservices.customer.data.booking.remote.dto.CustomerBookingsResponseDto
import com.homeservices.customer.data.booking.remote.dto.GetBookingResponseDto
import retrofit2.http.Body
import retrofit2.http.GET
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

    @GET("v1/bookings/{id}")
    public suspend fun getBooking(
        @Path("id") bookingId: String,
    ): GetBookingResponseDto

    @GET("v1/bookings")
    public suspend fun getMyBookings(): CustomerBookingsResponseDto

    @POST("v1/bookings/{id}/approve-final-price")
    public suspend fun approveFinalPrice(
        @Path("id") bookingId: String,
        @Body body: ApproveFinalPriceRequestDto,
    ): ApproveFinalPriceResponseDto
}

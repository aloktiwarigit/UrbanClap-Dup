package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.BookingResult
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CreateBookingRequestDto(
    val serviceId: String,
    val categoryId: String,
    val slotDate: String,
    val slotWindow: String,
    val addressText: String,
    val addressLatLng: LatLngDto,
)

@JsonClass(generateAdapter = true)
public data class LatLngDto(val lat: Double, val lng: Double)

@JsonClass(generateAdapter = true)
public data class CreateBookingResponseDto(
    val bookingId: String,
    val razorpayOrderId: String,
    val amount: Int,
) {
    public fun toDomain(): BookingResult = BookingResult(bookingId, razorpayOrderId, amount)
}

@JsonClass(generateAdapter = true)
public data class ConfirmBookingRequestDto(
    val razorpayPaymentId: String,
    val razorpayOrderId: String,
    val razorpaySignature: String,
)

@JsonClass(generateAdapter = true)
public data class ConfirmBookingResponseDto(val bookingId: String, val status: String)

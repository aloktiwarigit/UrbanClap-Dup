package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.PendingAddOn
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
public data class LatLngDto(
    val lat: Double,
    val lng: Double,
)

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
public data class ConfirmBookingResponseDto(
    val bookingId: String,
    val status: String,
)

@JsonClass(generateAdapter = true)
public data class PendingAddOnDto(
    val name: String,
    val price: Int,
    val triggerDescription: String,
) {
    public fun toDomain(): PendingAddOn = PendingAddOn(name, price, triggerDescription)
}

@JsonClass(generateAdapter = true)
public data class GetBookingResponseDto(
    val bookingId: String,
    val status: String,
    val amount: Int,
    val finalAmount: Int?,
    val pendingAddOns: List<PendingAddOnDto>,
)

@JsonClass(generateAdapter = true)
public data class AddOnDecisionDto(
    val name: String,
    val approved: Boolean,
)

@JsonClass(generateAdapter = true)
public data class ApproveFinalPriceRequestDto(
    val decisions: List<AddOnDecisionDto>,
)

@JsonClass(generateAdapter = true)
public data class ApproveFinalPriceResponseDto(
    val bookingId: String,
    val status: String,
    val finalAmount: Int?,
)

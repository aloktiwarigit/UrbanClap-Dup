package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.BookingResult
import com.homeservices.customer.domain.booking.model.CustomerBooking
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
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
    val paymentMethod: String = BookingPaymentMethod.RAZORPAY.name,
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
    val requiresPayment: Boolean = true,
    val paymentMethod: String? = null,
) {
    public fun toDomain(): BookingResult =
        BookingResult(
            bookingId = bookingId,
            razorpayOrderId = razorpayOrderId,
            amount = amount,
            requiresPayment = requiresPayment,
            paymentMethod =
                paymentMethod
                    ?.let { runCatching { BookingPaymentMethod.valueOf(it) }.getOrNull() }
                    ?: BookingPaymentMethod.RAZORPAY,
        )
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

@JsonClass(generateAdapter = true)
public data class CustomerBookingsResponseDto(
    val bookings: List<CustomerBookingDto> = emptyList(),
)

@JsonClass(generateAdapter = true)
public data class CustomerBookingDto(
    val bookingId: String,
    val serviceId: String,
    val serviceName: String,
    val addressText: String,
    val status: String,
    val slotDate: String,
    val slotWindow: String,
    val amount: Long,
    val paymentMethod: String? = null,
    val createdAt: String,
) {
    public fun toDomain(): CustomerBooking =
        CustomerBooking(
            bookingId = bookingId,
            serviceId = serviceId,
            serviceName = serviceName,
            addressText = addressText,
            status =
                runCatching {
                    CustomerBookingStatus.valueOf(status)
                }.getOrDefault(CustomerBookingStatus.UNKNOWN),
            slotDate = slotDate,
            slotWindow = slotWindow,
            amountPaise = amount,
            paymentMethod =
                paymentMethod
                    ?.let { runCatching { BookingPaymentMethod.valueOf(it) }.getOrNull() }
                    ?: BookingPaymentMethod.RAZORPAY,
            createdAt = createdAt,
        )
}

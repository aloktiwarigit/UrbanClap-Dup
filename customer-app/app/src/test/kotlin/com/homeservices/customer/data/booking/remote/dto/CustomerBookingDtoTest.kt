package com.homeservices.customer.data.booking.remote.dto

import com.homeservices.customer.domain.booking.model.BookingPaymentMethod
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

public class CustomerBookingDtoTest {

    private fun sampleDto(ratingSubmitted: Boolean = false): CustomerBookingDto =
        CustomerBookingDto(
            bookingId = "bk-test",
            serviceId = "svc-1",
            serviceName = "AC Repair",
            addressText = "101 Ayodhya",
            status = CustomerBookingStatus.COMPLETED.name,
            slotDate = "2026-05-14",
            slotWindow = "10:00-12:00",
            amount = 49900L,
            paymentMethod = BookingPaymentMethod.RAZORPAY.name,
            createdAt = "2026-05-12T08:00:00.000Z",
            ratingSubmitted = ratingSubmitted,
        )

    @Test
    public fun `ratingSubmitted false propagates through toDomain`() {
        val domain = sampleDto(ratingSubmitted = false).toDomain()
        assertThat(domain.ratingSubmitted).isFalse()
    }

    @Test
    public fun `ratingSubmitted true propagates through toDomain`() {
        val domain = sampleDto(ratingSubmitted = true).toDomain()
        assertThat(domain.ratingSubmitted).isTrue()
    }

    @Test
    public fun `ratingSubmitted defaults to false when not provided`() {
        val dto = CustomerBookingDto(
            bookingId = "bk-default",
            serviceId = "svc-1",
            serviceName = "Plumbing",
            addressText = "202 Faizabad",
            status = CustomerBookingStatus.CLOSED.name,
            slotDate = "2026-05-14",
            slotWindow = "14:00-16:00",
            amount = 29900L,
            paymentMethod = null,
            createdAt = "2026-05-11T10:00:00.000Z",
            // ratingSubmitted omitted — default should be false
        )
        assertThat(dto.toDomain().ratingSubmitted).isFalse()
    }

    @Test
    public fun `toDomain preserves other fields alongside ratingSubmitted`() {
        val domain = sampleDto(ratingSubmitted = true).toDomain()
        assertThat(domain.bookingId).isEqualTo("bk-test")
        assertThat(domain.status).isEqualTo(CustomerBookingStatus.COMPLETED)
        assertThat(domain.ratingSubmitted).isTrue()
    }
}

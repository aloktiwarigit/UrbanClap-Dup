package com.homeservices.customer.data.booking

import com.homeservices.customer.data.booking.remote.dto.CustomerBookingDto
import com.homeservices.customer.domain.booking.model.CustomerBookingStatus
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class CustomerBookingDtoTest {
    private fun dto(
        status: String = "COMPLETED",
        ratingSubmitted: Boolean = false,
    ): CustomerBookingDto =
        CustomerBookingDto(
            bookingId = "b1",
            serviceId = "s1",
            serviceName = "AC Repair",
            addressText = "123 Main St",
            status = status,
            slotDate = "2026-05-15",
            slotWindow = "10:00-12:00",
            amount = 50000L,
            paymentMethod = "RAZORPAY",
            createdAt = "2026-05-01T10:00:00Z",
            ratingSubmitted = ratingSubmitted,
        )

    @Test
    public fun `ratingSubmitted false is mapped to domain`() {
        val domain = dto(ratingSubmitted = false).toDomain()
        assertFalse(domain.ratingSubmitted)
    }

    @Test
    public fun `ratingSubmitted true is mapped to domain`() {
        val domain = dto(ratingSubmitted = true).toDomain()
        assertTrue(domain.ratingSubmitted)
    }

    @Test
    public fun `COMPLETED status maps correctly`() {
        val domain = dto(status = "COMPLETED").toDomain()
        assert(domain.status == CustomerBookingStatus.COMPLETED)
    }

    @Test
    public fun `CLOSED status maps correctly`() {
        val domain = dto(status = "CLOSED").toDomain()
        assert(domain.status == CustomerBookingStatus.CLOSED)
    }

    @Test
    public fun `unknown status maps to UNKNOWN`() {
        val domain = dto(status = "SOME_FUTURE_STATUS").toDomain()
        assert(domain.status == CustomerBookingStatus.UNKNOWN)
    }
}

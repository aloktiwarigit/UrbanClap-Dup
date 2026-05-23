package com.homeservices.technician.data.jobs

import com.homeservices.technician.data.jobs.remote.dto.TechnicianBookingDto
import com.homeservices.technician.domain.jobs.model.TechnicianBookingStatus
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class TechnicianBookingDtoTest {
    private fun dto(status: String) =
        TechnicianBookingDto(
            bookingId = "bk-99",
            serviceId = "svc-2",
            serviceName = "Painting",
            addressText = "5 Cross Road",
            status = status,
            slotDate = "2026-07-10",
            slotWindow = "14:00-16:00",
            amount = 75000L,
        )

    @Test
    public fun `toDomain maps known status COMPLETED correctly`() {
        val booking = dto("COMPLETED").toDomain()

        assertThat(booking.bookingId).isEqualTo("bk-99")
        assertThat(booking.status).isEqualTo(TechnicianBookingStatus.COMPLETED)
        assertThat(booking.amountPaise).isEqualTo(75000L)
    }

    @Test
    public fun `toDomain maps unrecognised status to UNKNOWN`() {
        val booking = dto("SOME_FUTURE_STATUS").toDomain()

        assertThat(booking.status).isEqualTo(TechnicianBookingStatus.UNKNOWN)
    }
}

package com.homeservices.technician.data.availability

import com.homeservices.technician.data.availability.remote.dto.AvailabilityWindowDto
import com.homeservices.technician.data.availability.remote.dto.TechnicianAvailabilityDto
import com.homeservices.technician.data.availability.remote.dto.toDto
import com.homeservices.technician.data.availability.remote.dto.toRequestDto
import com.homeservices.technician.domain.availability.model.AvailabilityWindow
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class AvailabilityDtosTest {
    @Test
    public fun `AvailabilityWindowDto toDomain maps all fields`() {
        val dto = AvailabilityWindowDto(dayOfWeek = 3, startHour = 9, endHour = 13)

        val domain = dto.toDomain()

        assertThat(domain).isEqualTo(AvailabilityWindow(dayOfWeek = 3, startHour = 9, endHour = 13))
    }

    @Test
    public fun `TechnicianAvailabilityDto toDomain maps nested windows`() {
        val dto =
            TechnicianAvailabilityDto(
                isOnline = true,
                isAvailable = false,
                availabilityWindows = listOf(AvailabilityWindowDto(1, 8, 12)),
            )

        val domain = dto.toDomain()

        assertThat(domain.isOnline).isTrue()
        assertThat(domain.isAvailable).isFalse()
        assertThat(domain.availabilityWindows).containsExactly(AvailabilityWindow(1, 8, 12))
    }

    @Test
    public fun `AvailabilityWindow toDto maps all fields`() {
        val window = AvailabilityWindow(dayOfWeek = 5, startHour = 10, endHour = 14)

        val dto = window.toDto()

        assertThat(dto).isEqualTo(AvailabilityWindowDto(dayOfWeek = 5, startHour = 10, endHour = 14))
    }

    @Test
    public fun `TechnicianAvailability toRequestDto maps all fields and nested windows`() {
        val availability =
            TechnicianAvailability(
                isOnline = false,
                isAvailable = true,
                availabilityWindows = listOf(AvailabilityWindow(2, 7, 11)),
            )

        val dto = availability.toRequestDto()

        assertThat(dto.isOnline).isFalse()
        assertThat(dto.isAvailable).isTrue()
        assertThat(dto.availabilityWindows).containsExactly(AvailabilityWindowDto(2, 7, 11))
    }
}

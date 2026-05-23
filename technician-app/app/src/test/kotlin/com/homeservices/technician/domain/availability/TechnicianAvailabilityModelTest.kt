package com.homeservices.technician.domain.availability

import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import com.homeservices.technician.domain.availability.model.defaultAvailabilityWindows
import com.homeservices.technician.domain.availability.model.defaultTechnicianAvailability
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class TechnicianAvailabilityModelTest {
    @Test
    public fun `acceptingJobs is true when both isOnline and isAvailable are true`() {
        val availability = TechnicianAvailability(isOnline = true, isAvailable = true, availabilityWindows = emptyList())
        assertThat(availability.acceptingJobs).isTrue()
    }

    @Test
    public fun `acceptingJobs is false when isOnline is false`() {
        val availability = TechnicianAvailability(isOnline = false, isAvailable = true, availabilityWindows = emptyList())
        assertThat(availability.acceptingJobs).isFalse()
    }

    @Test
    public fun `acceptingJobs is false when isAvailable is false`() {
        val availability = TechnicianAvailability(isOnline = true, isAvailable = false, availabilityWindows = emptyList())
        assertThat(availability.acceptingJobs).isFalse()
    }

    @Test
    public fun `defaultAvailabilityWindows returns 14 windows — two per day for 7 days`() {
        val windows = defaultAvailabilityWindows()
        assertThat(windows).hasSize(14)
        assertThat(windows.map { it.dayOfWeek }.distinct()).containsExactlyInAnyOrder(0, 1, 2, 3, 4, 5, 6)
        assertThat(windows.filter { it.startHour == 8 && it.endHour == 12 }).hasSize(7)
        assertThat(windows.filter { it.startHour == 12 && it.endHour == 17 }).hasSize(7)
    }

    @Test
    public fun `defaultTechnicianAvailability is online and accepting jobs with 14 windows`() {
        val availability = defaultTechnicianAvailability()
        assertThat(availability.isOnline).isTrue()
        assertThat(availability.isAvailable).isTrue()
        assertThat(availability.acceptingJobs).isTrue()
        assertThat(availability.availabilityWindows).hasSize(14)
    }
}

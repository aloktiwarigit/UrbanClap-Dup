package com.homeservices.technician.domain.availability.model

public data class AvailabilityWindow(
    val dayOfWeek: Int,
    val startHour: Int,
    val endHour: Int,
)

public data class TechnicianAvailability(
    val isOnline: Boolean,
    val isAvailable: Boolean,
    val availabilityWindows: List<AvailabilityWindow>,
) {
    public val acceptingJobs: Boolean
        get() = isOnline && isAvailable
}

public fun defaultAvailabilityWindows(): List<AvailabilityWindow> =
    (0..6).flatMap { dayOfWeek ->
        listOf(
            AvailabilityWindow(dayOfWeek = dayOfWeek, startHour = 8, endHour = 12),
            AvailabilityWindow(dayOfWeek = dayOfWeek, startHour = 12, endHour = 17),
        )
    }

public fun defaultTechnicianAvailability(): TechnicianAvailability =
    TechnicianAvailability(
        isOnline = true,
        isAvailable = true,
        availabilityWindows = defaultAvailabilityWindows(),
    )

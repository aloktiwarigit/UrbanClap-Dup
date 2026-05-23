package com.homeservices.technician.data.availability.remote.dto

import com.homeservices.technician.domain.availability.model.AvailabilityWindow
import com.homeservices.technician.domain.availability.model.TechnicianAvailability
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
internal data class AvailabilityWindowDto(
    val dayOfWeek: Int,
    val startHour: Int,
    val endHour: Int,
) {
    fun toDomain(): AvailabilityWindow =
        AvailabilityWindow(
            dayOfWeek = dayOfWeek,
            startHour = startHour,
            endHour = endHour,
        )
}

@JsonClass(generateAdapter = true)
internal data class TechnicianAvailabilityDto(
    val isOnline: Boolean,
    val isAvailable: Boolean,
    val availabilityWindows: List<AvailabilityWindowDto>,
) {
    fun toDomain(): TechnicianAvailability =
        TechnicianAvailability(
            isOnline = isOnline,
            isAvailable = isAvailable,
            availabilityWindows = availabilityWindows.map { it.toDomain() },
        )
}

@JsonClass(generateAdapter = true)
internal data class UpdateAvailabilityRequestDto(
    val isOnline: Boolean,
    val isAvailable: Boolean,
    val availabilityWindows: List<AvailabilityWindowDto>,
)

internal fun AvailabilityWindow.toDto(): AvailabilityWindowDto =
    AvailabilityWindowDto(
        dayOfWeek = dayOfWeek,
        startHour = startHour,
        endHour = endHour,
    )

internal fun TechnicianAvailability.toRequestDto(): UpdateAvailabilityRequestDto =
    UpdateAvailabilityRequestDto(
        isOnline = isOnline,
        isAvailable = isAvailable,
        availabilityWindows = availabilityWindows.map { it.toDto() },
    )

package com.homeservices.technician.data.serviceprofile.remote.dto

import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile

internal data class ServiceLocationDto(
    val lat: Double,
    val lng: Double,
) {
    fun toDomain(): ServiceLocation =
        ServiceLocation(
            lat = lat,
            lng = lng,
        )
}

internal data class ServiceProfileDto(
    val skills: List<String>,
    val location: ServiceLocationDto?,
) {
    fun toDomain(): ServiceProfile =
        ServiceProfile(
            skills = skills,
            location = location?.toDomain(),
        )
}

internal data class UpdateServiceProfileRequestDto(
    val skills: List<String>,
    val location: ServiceLocationDto?,
)

internal fun ServiceLocation.toDto(): ServiceLocationDto =
    ServiceLocationDto(
        lat = lat,
        lng = lng,
    )

internal fun ServiceProfile.toRequestDto(): UpdateServiceProfileRequestDto =
    UpdateServiceProfileRequestDto(
        skills = skills,
        location = location?.toDto(),
    )

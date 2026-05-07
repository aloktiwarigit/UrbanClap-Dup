package com.homeservices.technician.data.serviceprofile.remote.dto

import com.homeservices.technician.domain.serviceprofile.model.ServiceLocation
import com.homeservices.technician.domain.serviceprofile.model.ServiceProfile
import com.squareup.moshi.Json

internal data class ServiceLocationDto(
    @Json(name = "lat") val lat: Double,
    @Json(name = "lng") val lng: Double,
) {
    fun toDomain(): ServiceLocation =
        ServiceLocation(
            lat = lat,
            lng = lng,
        )
}

internal data class ServiceProfileDto(
    @Json(name = "skills") val skills: List<String>,
    @Json(name = "location") val location: ServiceLocationDto?,
) {
    fun toDomain(): ServiceProfile =
        ServiceProfile(
            skills = skills,
            location = location?.toDomain(),
        )
}

internal data class UpdateServiceProfileRequestDto(
    @Json(name = "skills") val skills: List<String>,
    @Json(name = "location") val location: ServiceLocationDto?,
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

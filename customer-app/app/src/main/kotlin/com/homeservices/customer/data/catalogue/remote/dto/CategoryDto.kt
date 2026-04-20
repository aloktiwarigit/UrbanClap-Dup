package com.homeservices.customer.data.catalogue.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CategoryDto(
    @Json(name = "id") public val id: String,
    @Json(name = "name") public val name: String,
    @Json(name = "imageUrl") public val imageUrl: String,
    @Json(name = "serviceCount") public val serviceCount: Int,
)

public fun CategoryDto.toDomain() =
    com.homeservices.customer.domain.catalogue.model.Category(
        id = id,
        name = name,
        imageUrl = imageUrl,
        serviceCount = serviceCount,
    )

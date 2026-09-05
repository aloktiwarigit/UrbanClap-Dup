package com.homeservices.customer.data.catalogue.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Wraps the `/v1/categories` response. The API returns `{"categories": [...]}` rather
 * than a bare array so the response shape is forward-extensible (e.g. future pagination
 * / hero-banner / promotional-collections fields can be added without breaking clients).
 */
@JsonClass(generateAdapter = true)
public data class CategoriesResponse(
    @Json(name = "categories") public val categories: List<CategoryDto>,
)

@JsonClass(generateAdapter = true)
public data class CategoryDto(
    @Json(name = "id") public val id: String,
    @Json(name = "name") public val name: String,
    @Json(name = "heroImageUrl") public val heroImageUrl: String,
    @Json(name = "sortOrder") public val sortOrder: Int = 0,
    @Json(name = "services") public val services: List<ServiceCardDto>,
    @Json(name = "safetyTag") public val safetyTag: Boolean = false,
    @Json(name = "nameHi") public val nameHi: String? = null,
)

public fun CategoryDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Category =
    com.homeservices.customer.domain.catalogue.model.Category(
        id = id,
        name = name,
        imageUrl = heroImageUrl,
        serviceCount = services.size,
        minPricePaise = services.minOfOrNull { it.basePrice } ?: 0,
        safetyTag = safetyTag,
        nameHi = nameHi,
    )

package com.homeservices.customer.data.catalogue.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CatalogueListResponse(
    @Json(name = "categories") val categories: List<CategoryDto>,
)

@JsonClass(generateAdapter = true)
public data class CategoryDto(
    @Json(name = "id") public val id: String,
    @Json(name = "name") public val name: String,
    @Json(name = "heroImageUrl") public val imageUrl: String,
    @Json(name = "services") public val services: List<ServiceSummaryDto>,
)

@JsonClass(generateAdapter = true)
public data class ServiceSummaryDto(
    @Json(name = "id") public val id: String,
    @Json(name = "categoryId") public val categoryId: String,
    @Json(name = "name") public val name: String,
    @Json(name = "shortDescription") public val shortDescription: String,
    @Json(name = "heroImageUrl") public val heroImageUrl: String,
    @Json(name = "basePrice") public val basePrice: Int,
    @Json(name = "durationMinutes") public val durationMinutes: Int,
)

public fun CategoryDto.toDomain() =
    com.homeservices.customer.domain.catalogue.model.Category(
        id = id,
        name = name,
        imageUrl = imageUrl,
        serviceCount = services.size,
        minPricePaise = services.minOfOrNull { it.basePrice } ?: 0,
    )

public fun ServiceSummaryDto.toServiceDomain() =
    com.homeservices.customer.domain.catalogue.model.Service(
        id = id,
        categoryId = categoryId,
        name = name,
        description = shortDescription,
        basePrice = basePrice,
        durationMinutes = durationMinutes,
        imageUrl = heroImageUrl,
        includes = emptyList(),
        addOns = emptyList(),
    )

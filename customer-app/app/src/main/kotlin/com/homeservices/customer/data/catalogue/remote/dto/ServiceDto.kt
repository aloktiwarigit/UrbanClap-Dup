package com.homeservices.customer.data.catalogue.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/**
 * Add-on as returned by the API's ServiceDetailSchema (`/v1/services/{id}`).
 * Card responses do not include add-ons.
 */
@JsonClass(generateAdapter = true)
public data class AddOnDto(
    @Json(name = "id") public val id: String,
    @Json(name = "name") public val name: String,
    @Json(name = "price") public val price: Int,
    @Json(name = "triggerCondition") public val triggerCondition: String,
)

/**
 * Service shape returned in the embedded `services` array on `/v1/categories`.
 * Mirrors the API's ServiceCardSchema — a strict subset of the full ServiceSchema.
 *
 * Card responses do NOT include `includes`, `addOns`, `faq`, or `photoStages` — those
 * arrive on the detail endpoint via [ServiceDto].
 */
@JsonClass(generateAdapter = true)
public data class ServiceCardDto(
    @Json(name = "id") public val id: String,
    @Json(name = "categoryId") public val categoryId: String,
    @Json(name = "name") public val name: String,
    @Json(name = "shortDescription") public val shortDescription: String,
    @Json(name = "heroImageUrl") public val heroImageUrl: String,
    @Json(name = "basePrice") public val basePrice: Int,
    @Json(name = "durationMinutes") public val durationMinutes: Int,
)

public fun ServiceCardDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Service =
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

/**
 * Full service shape returned by `/v1/services/{id}`. Mirrors the API's
 * ServiceDetailSchema — everything except internal admin fields (commissionBps,
 * updatedBy, createdAt, updatedAt).
 *
 * `faq`, `photoStages`, and `isActive` are deserialized but not currently surfaced
 * to the domain layer. Add to [com.homeservices.customer.domain.catalogue.model.Service]
 * if a future screen needs them.
 */
@JsonClass(generateAdapter = true)
public data class ServiceDto(
    @Json(name = "id") public val id: String,
    @Json(name = "categoryId") public val categoryId: String,
    @Json(name = "name") public val name: String,
    @Json(name = "shortDescription") public val shortDescription: String,
    @Json(name = "heroImageUrl") public val heroImageUrl: String,
    @Json(name = "basePrice") public val basePrice: Int,
    @Json(name = "durationMinutes") public val durationMinutes: Int,
    @Json(name = "includes") public val includes: List<String>,
    @Json(name = "addOns") public val addOns: List<AddOnDto>,
    @Json(name = "isActive") public val isActive: Boolean = true,
)

public fun ServiceDto.toDomain(): com.homeservices.customer.domain.catalogue.model.Service =
    com.homeservices.customer.domain.catalogue.model.Service(
        id = id,
        categoryId = categoryId,
        name = name,
        description = shortDescription,
        basePrice = basePrice,
        durationMinutes = durationMinutes,
        imageUrl = heroImageUrl,
        includes = includes,
        addOns =
            addOns.map {
                com.homeservices.customer.domain.catalogue.model.AddOn(
                    name = it.name,
                    price = it.price,
                )
            },
    )

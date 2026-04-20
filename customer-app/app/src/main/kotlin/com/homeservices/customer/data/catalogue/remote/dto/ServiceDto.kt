package com.homeservices.customer.data.catalogue.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class AddOnDto(
    @Json(name = "name")  public val name: String,
    @Json(name = "price") public val price: Int,
)

@JsonClass(generateAdapter = true)
public data class ServiceDto(
    @Json(name = "id")              public val id: String,
    @Json(name = "categoryId")      public val categoryId: String,
    @Json(name = "name")            public val name: String,
    @Json(name = "description")     public val description: String,
    @Json(name = "basePrice")       public val basePrice: Int,
    @Json(name = "durationMinutes") public val durationMinutes: Int,
    @Json(name = "imageUrl")        public val imageUrl: String,
    @Json(name = "includes")        public val includes: List<String>,
    @Json(name = "addOns")          public val addOns: List<AddOnDto>,
)

public fun ServiceDto.toDomain() = com.homeservices.customer.domain.catalogue.model.Service(
    id = id, categoryId = categoryId, name = name, description = description,
    basePrice = basePrice, durationMinutes = durationMinutes, imageUrl = imageUrl,
    includes = includes,
    addOns = addOns.map { com.homeservices.customer.domain.catalogue.model.AddOn(it.name, it.price) },
)

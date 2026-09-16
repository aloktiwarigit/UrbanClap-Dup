package com.homeservices.technician.data.catalogue.remote.dto

import com.homeservices.technician.domain.catalogue.model.SelectableService
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
internal data class CatalogueServiceDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
)

@JsonClass(generateAdapter = true)
internal data class CatalogueCategoryDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "sortOrder") val sortOrder: Int = 0,
    @Json(name = "services") val services: List<CatalogueServiceDto>? = null,
)

@JsonClass(generateAdapter = true)
internal data class CategoriesResponseDto(
    @Json(name = "categories") val categories: List<CatalogueCategoryDto>,
) {
    fun toDomain(): List<SelectableService> =
        categories
            .sortedBy { it.sortOrder }
            .flatMap { category ->
                (category.services ?: emptyList()).map { service ->
                    SelectableService(
                        id = service.id,
                        name = service.name,
                        group = category.name,
                    )
                }
            }
}

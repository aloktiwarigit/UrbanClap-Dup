package com.homeservices.customer.data.catalogue.remote

import com.homeservices.customer.data.catalogue.remote.dto.CategoriesResponse
import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
import retrofit2.http.GET
import retrofit2.http.Path

/**
 * Public catalogue endpoints — no authentication required.
 *
 * The API returns categories with their services embedded (see [CategoriesResponse]),
 * so a single round-trip provides everything needed to render the catalogue home and
 * the per-category service list. There is intentionally no separate
 * `/v1/services?categoryId=` endpoint; the client filters from the categories response.
 */
public interface CatalogueApiService {
    @GET("v1/categories")
    public suspend fun getCategories(): CategoriesResponse

    @GET("v1/services/{id}")
    public suspend fun getServiceDetail(
        @Path("id") id: String,
    ): ServiceDto
}

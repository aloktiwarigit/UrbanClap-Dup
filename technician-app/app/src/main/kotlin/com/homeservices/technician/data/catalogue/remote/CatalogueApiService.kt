package com.homeservices.technician.data.catalogue.remote

import com.homeservices.technician.data.catalogue.remote.dto.CategoriesResponseDto
import retrofit2.http.GET

internal interface CatalogueApiService {
    @GET("v1/categories")
    suspend fun getCategories(): CategoriesResponseDto
}

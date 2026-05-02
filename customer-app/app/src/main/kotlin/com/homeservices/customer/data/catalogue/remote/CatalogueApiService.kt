package com.homeservices.customer.data.catalogue.remote

import com.homeservices.customer.data.catalogue.remote.dto.CatalogueListResponse
import com.homeservices.customer.data.catalogue.remote.dto.ServiceDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

public interface CatalogueApiService {
    @GET("v1/categories")
    public suspend fun getCategories(): CatalogueListResponse

    @GET("v1/services/{id}")
    public suspend fun getServiceDetail(
        @Path("id") id: String,
    ): ServiceDto

    @GET("v1/services")
    public suspend fun getServicesForCategory(
        @Query("categoryId") categoryId: String,
    ): List<ServiceDto>
}

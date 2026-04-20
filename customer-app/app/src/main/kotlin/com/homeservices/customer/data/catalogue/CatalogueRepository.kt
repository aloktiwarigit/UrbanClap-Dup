package com.homeservices.customer.data.catalogue

import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import kotlinx.coroutines.flow.Flow

public interface CatalogueRepository {
    public fun getCategories(): Flow<Result<List<Category>>>
    public fun getServicesForCategory(categoryId: String): Flow<Result<List<Service>>>
    public fun getServiceDetail(serviceId: String): Flow<Result<Service>>
}

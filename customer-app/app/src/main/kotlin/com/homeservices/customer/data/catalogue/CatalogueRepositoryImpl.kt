package com.homeservices.customer.data.catalogue

import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
import com.homeservices.customer.data.catalogue.remote.dto.toDomain
import com.homeservices.customer.data.catalogue.remote.dto.toServiceDomain
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class CatalogueRepositoryImpl
    @Inject
    constructor(
        private val api: CatalogueApiService,
    ) : CatalogueRepository {
        override fun getCategories(): Flow<Result<List<Category>>> =
            flow {
                emit(runCatching { api.getCategories().categories.map { it.toDomain() } })
            }

        override fun getServicesForCategory(categoryId: String): Flow<Result<List<Service>>> =
            flow {
                emit(
                    runCatching {
                        api.getCategories()
                            .categories
                            .firstOrNull { it.id == categoryId }
                            ?.services
                            ?.map { it.toServiceDomain() }
                            .orEmpty()
                    },
                )
            }

        override fun getServiceDetail(serviceId: String): Flow<Result<Service>> =
            flow {
                emit(runCatching { api.getServiceDetail(serviceId).toDomain() })
            }
    }

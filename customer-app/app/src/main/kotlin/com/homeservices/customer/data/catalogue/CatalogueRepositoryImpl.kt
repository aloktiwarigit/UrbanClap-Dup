package com.homeservices.customer.data.catalogue

import com.homeservices.customer.data.catalogue.remote.CatalogueApiService
import com.homeservices.customer.data.catalogue.remote.dto.toDomain
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

        /**
         * The API embeds services inside each category on `/v1/categories`, so this
         * implementation re-uses that single endpoint and filters client-side rather
         * than making a second round-trip. Future caching layer can short-circuit
         * the second fetch.
         */
        override fun getServicesForCategory(categoryId: String): Flow<Result<List<Service>>> =
            flow {
                emit(
                    runCatching {
                        val categories = api.getCategories().categories
                        val match =
                            categories.find { it.id == categoryId }
                                ?: throw NoSuchElementException("Category not found: $categoryId")
                        match.services.map { it.toDomain() }
                    },
                )
            }

        override fun getServiceDetail(serviceId: String): Flow<Result<Service>> =
            flow {
                emit(runCatching { api.getServiceDetail(serviceId).toDomain() })
            }
    }

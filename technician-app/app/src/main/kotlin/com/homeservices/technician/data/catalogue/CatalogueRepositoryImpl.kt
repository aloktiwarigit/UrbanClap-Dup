package com.homeservices.technician.data.catalogue

import com.homeservices.technician.data.catalogue.remote.CatalogueApiService
import com.homeservices.technician.domain.catalogue.CatalogueRepository
import com.homeservices.technician.domain.catalogue.model.SelectableService
import javax.inject.Inject

internal class CatalogueRepositoryImpl
    @Inject
    constructor(
        private val apiService: CatalogueApiService,
    ) : CatalogueRepository {
        override suspend fun getSelectableServices(): Result<List<SelectableService>> =
            runCatching { apiService.getCategories().toDomain() }
    }

package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.catalogue.model.Service
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetServicesForCategoryUseCase
    @Inject
    constructor(
        private val repository: CatalogueRepository,
    ) {
        public operator fun invoke(categoryId: String): Flow<Result<List<Service>>> = repository.getServicesForCategory(categoryId)
    }

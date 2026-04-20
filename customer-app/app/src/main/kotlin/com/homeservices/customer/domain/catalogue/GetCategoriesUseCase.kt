package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.data.catalogue.CatalogueRepository
import com.homeservices.customer.domain.catalogue.model.Category
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetCategoriesUseCase @Inject constructor(
    private val repository: CatalogueRepository,
) {
    public operator fun invoke(): Flow<Result<List<Category>>> = repository.getCategories()
}

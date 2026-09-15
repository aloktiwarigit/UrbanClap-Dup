package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService
import javax.inject.Inject

public class GetSelectableServicesUseCase
    @Inject
    constructor(
        private val repository: CatalogueRepository,
    ) {
        public suspend operator fun invoke(): Result<List<SelectableService>> = repository.getSelectableServices()
    }

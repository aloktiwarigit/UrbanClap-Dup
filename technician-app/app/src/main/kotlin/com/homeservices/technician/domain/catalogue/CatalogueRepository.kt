package com.homeservices.technician.domain.catalogue

import com.homeservices.technician.domain.catalogue.model.SelectableService

public interface CatalogueRepository {
    public suspend fun getSelectableServices(): Result<List<SelectableService>>
}

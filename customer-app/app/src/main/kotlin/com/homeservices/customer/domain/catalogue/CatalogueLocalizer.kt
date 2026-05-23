package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.data.catalogue.HindiLocaleNames
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class CatalogueLocalizer
    @Inject
    constructor() {
        public fun localizeCategory(
            category: Category,
            locale: String,
        ): Category =
            if (locale.startsWith("hi")) {
                val hindiName = HindiLocaleNames.categoryHindiNames[category.id]
                if (hindiName != null) category.copy(name = hindiName) else category
            } else {
                category
            }

        public fun localizeService(
            service: Service,
            locale: String,
        ): Service =
            if (locale.startsWith("hi")) {
                val hindiName = HindiLocaleNames.serviceHindiNames[service.id]
                val hindiDesc = HindiLocaleNames.serviceShortDescriptionsHindi[service.id]
                service.copy(
                    name = hindiName ?: service.name,
                    description = hindiDesc ?: service.description,
                )
            } else {
                service
            }
    }

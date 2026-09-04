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
                // E22-S01 three-level fallback:
                //   1. server nameHi        — reaches customers with no app release
                //   2. compiled-in map      — keeps APKs in the field working
                //   3. English              — better than a blank label
                category.copy(
                    name =
                        category.nameHi
                            ?: HindiLocaleNames.categoryHindiNames[category.id]
                            ?: category.name,
                )
            } else {
                category
            }

        public fun localizeService(
            service: Service,
            locale: String,
        ): Service =
            if (locale.startsWith("hi")) {
                // E22-S01 three-level fallback:
                //   1. server nameHi        — reaches customers with no app release
                //   2. compiled-in map      — keeps APKs in the field working
                //   3. English              — better than a blank label
                service.copy(
                    name =
                        service.nameHi
                            ?: HindiLocaleNames.serviceHindiNames[service.id]
                            ?: service.name,
                    description =
                        service.descriptionHi
                            ?: HindiLocaleNames.serviceShortDescriptionsHindi[service.id]
                            ?: service.description,
                )
            } else {
                service
            }
    }

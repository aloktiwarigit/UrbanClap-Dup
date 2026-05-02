package com.homeservices.customer.domain.catalogue

import com.google.common.truth.Truth.assertThat
import com.homeservices.customer.domain.catalogue.model.AddOn
import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import org.junit.Test

public class CatalogueLocalizerTest {
    private val localizer = CatalogueLocalizer()

    private val acCategory = Category(
        id = "ac-repair",
        name = "AC Repair",
        imageUrl = "x",
        serviceCount = 3,
    )

    private val acService = Service(
        id = "ac-deep-clean",
        categoryId = "ac-repair",
        name = "AC Deep Clean",
        description = "Chemical wash, gas check.",
        basePrice = 59900,
        durationMinutes = 90,
        imageUrl = "x",
        includes = emptyList(),
        addOns = emptyList<AddOn>(),
    )

    @Test
    public fun `category is left untouched when locale is en`() {
        val result = localizer.localizeCategory(acCategory, locale = "en")
        assertThat(result).isEqualTo(acCategory)
    }

    @Test
    public fun `category name is substituted to Hindi when locale is hi`() {
        val result = localizer.localizeCategory(acCategory, locale = "hi")
        assertThat(result.name).isEqualTo("एसी मरम्मत")
        assertThat(result.id).isEqualTo("ac-repair")
    }

    @Test
    public fun `unknown category id falls back to API name on hi`() {
        val unknown = acCategory.copy(id = "unknown-id", name = "Mystery Service")
        val result = localizer.localizeCategory(unknown, locale = "hi")
        assertThat(result.name).isEqualTo("Mystery Service")
    }

    @Test
    public fun `service name and description are substituted on hi`() {
        val result = localizer.localizeService(acService, locale = "hi")
        assertThat(result.name).isEqualTo("एसी डीप क्लीन")
        assertThat(result.description).isEqualTo("केमिकल वॉश, गैस चेक, फिल्टर सफाई — पूरी तरह से ₹599 में।")
    }

    @Test
    public fun `service is left untouched when locale is en`() {
        val result = localizer.localizeService(acService, locale = "en")
        assertThat(result).isEqualTo(acService)
    }

    @Test
    public fun `service with no Hindi description keeps API description on hi`() {
        val unknown = acService.copy(id = "unknown-svc", name = "X", description = "Original.")
        val result = localizer.localizeService(unknown, locale = "hi")
        assertThat(result.description).isEqualTo("Original.")
        assertThat(result.name).isEqualTo("X")
    }
}

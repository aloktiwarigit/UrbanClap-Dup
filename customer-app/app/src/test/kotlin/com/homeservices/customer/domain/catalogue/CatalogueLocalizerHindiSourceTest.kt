package com.homeservices.customer.domain.catalogue

import com.homeservices.customer.domain.catalogue.model.Category
import com.homeservices.customer.domain.catalogue.model.Service
import org.junit.Assert.assertEquals
import org.junit.Test

public class CatalogueLocalizerHindiSourceTest {
    private val localizer = CatalogueLocalizer()

    private fun service(
        id: String,
        nameHi: String? = null,
        descriptionHi: String? = null,
    ) = Service(
        id = id,
        categoryId = "ac-repair",
        name = "AC Deep Clean",
        description = "Chemical wash.",
        nameHi = nameHi,
        descriptionHi = descriptionHi,
        basePrice = 99900,
        durationMinutes = 90,
        imageUrl = "",
        includes = emptyList(),
        addOns = emptyList(),
    )

    private fun category(
        id: String,
        nameHi: String? = null,
    ) = Category(
        id = id,
        name = "AC Repair",
        imageUrl = "",
        serviceCount = 3,
        minPricePaise = 59900,
        nameHi = nameHi,
    )

    @Test
    public fun `server Hindi wins over the compiled map`() {
        val result = localizer.localizeService(service("ac-deep-clean", nameHi = "सर्वर नाम"), "hi")
        assertEquals("सर्वर नाम", result.name)
    }

    @Test
    public fun `falls back to the compiled map when the server sends no Hindi`() {
        val result = localizer.localizeService(service("ac-deep-clean"), "hi")
        assertEquals("एसी डीप क्लीन", result.name)
    }

    // The whole point of the story: a service added via the dashboard after this
    // APK shipped has no compiled-in entry, and must still render in Hindi.
    @Test
    public fun `a service unknown to the compiled map still renders server Hindi`() {
        val result = localizer.localizeService(service("brand-new-service", nameHi = "नई सेवा"), "hi")
        assertEquals("नई सेवा", result.name)
    }

    @Test
    public fun `falls back to English when neither source has Hindi`() {
        val result = localizer.localizeService(service("brand-new-service"), "hi")
        assertEquals("AC Deep Clean", result.name)
    }

    @Test
    public fun `English locale is untouched even when server Hindi exists`() {
        val result = localizer.localizeService(service("ac-deep-clean", nameHi = "सर्वर नाम"), "en")
        assertEquals("AC Deep Clean", result.name)
    }

    @Test
    public fun `category server Hindi wins over the compiled map`() {
        val result = localizer.localizeCategory(category("ac-repair", nameHi = "सर्वर श्रेणी"), "hi")
        assertEquals("सर्वर श्रेणी", result.name)
    }

    @Test
    public fun `category falls back to the compiled map when the server sends no Hindi`() {
        val result = localizer.localizeCategory(category("ac-repair"), "hi")
        assertEquals("एसी मरम्मत", result.name)
    }
}

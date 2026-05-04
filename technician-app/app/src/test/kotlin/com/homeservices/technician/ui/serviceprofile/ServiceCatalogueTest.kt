package com.homeservices.technician.ui.serviceprofile

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ServiceCatalogueTest {
    @Test
    public fun `curated catalogue uses service IDs from seed catalogue`(): Unit {
        val ids = ServiceCatalogue.items.map { it.id }

        assertThat(ids)
            .containsExactly(
                "ac-deep-clean",
                "ac-gas-refill",
                "ac-installation",
                "plumbing-leak-fix",
                "plumbing-tap-install",
                "plumbing-pipe-repair",
                "electrical-fan-install",
                "electrical-switchboard-fix",
                "electrical-wiring",
                "ro-installation",
                "ro-service-amc",
                "water-pump-repair",
                "borewell-servicing",
            )
    }

    @Test
    public fun `curated catalogue does not expose category IDs as skills`(): Unit {
        val ids = ServiceCatalogue.items.map { it.id }

        assertThat(ids)
            .doesNotContain(
                "ac-repair",
                "plumbing",
                "electrical",
                "water-purifier",
                "water-pump",
            )
    }
}

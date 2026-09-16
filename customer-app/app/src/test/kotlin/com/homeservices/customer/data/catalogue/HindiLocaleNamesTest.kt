package com.homeservices.customer.data.catalogue

import org.junit.Assert.assertTrue
import org.junit.Test

public class HindiLocaleNamesTest {
    // The services activated 2026-09-15 (ADR-0030), plus ac-deep-clean-window which
    // was already live with no Hindi copy and no hero image.
    private val requiredServiceIds =
        listOf(
            "ac-deep-clean-window",
            "appliance-fridge-repair",
            "appliance-cooler-service",
            "appliance-washing-machine-repair",
            "electrical-camera-installation",
            "appliance-inverter-service",
        )

    @Test
    public fun `every required service has a Hindi name`(): Unit {
        val missing = requiredServiceIds.filterNot { HindiLocaleNames.serviceHindiNames.containsKey(it) }
        assertTrue("Missing Hindi names for: $missing", missing.isEmpty())
    }

    @Test
    public fun `every required service has a Hindi short description`(): Unit {
        val missing = requiredServiceIds.filterNot { HindiLocaleNames.serviceShortDescriptionsHindi.containsKey(it) }
        assertTrue("Missing Hindi descriptions for: $missing", missing.isEmpty())
    }

    @Test
    public fun `the appliance-repair category has a Hindi name`(): Unit {
        assertTrue(HindiLocaleNames.categoryHindiNames.containsKey("appliance-repair"))
    }

    @Test
    public fun `no Hindi value is accidentally left in Latin script`(): Unit {
        val devanagari = Regex("[\\u0900-\\u097F]")
        val latinOnly =
            (HindiLocaleNames.serviceHindiNames + HindiLocaleNames.categoryHindiNames)
                .filterValues { !devanagari.containsMatchIn(it) }
        assertTrue("Non-Devanagari values: ${latinOnly.keys}", latinOnly.isEmpty())
    }
}

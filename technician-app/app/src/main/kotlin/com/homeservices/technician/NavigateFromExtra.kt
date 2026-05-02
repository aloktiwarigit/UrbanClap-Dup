package com.homeservices.technician

import com.homeservices.technician.data.rating.RatingReceivedEventBus

/**
 * Maps an Intent extra `navigate_to` value to a side-effect on a corresponding event bus.
 *
 * Used by [MainActivity.onCreate] to route FCM-triggered cold-start intents to the right
 * downstream listener. Currently only the `ratings_transparency` value is wired; other
 * values are no-ops.
 *
 * Extracted as a top-level function so the routing logic is unit-testable without an
 * Android instrumentation harness (see `MainActivityNavTest`).
 */
public fun navigateFromExtra(
    navigateTo: String?,
    ratingReceivedEventBus: RatingReceivedEventBus,
) {
    if (navigateTo == "ratings_transparency") {
        ratingReceivedEventBus.post()
    }
}

package com.homeservices.technician.observability.analytics

import org.junit.jupiter.api.Test

public class AnalyticsTrackerTest {
    @Test
    public fun `capture does not throw when called before PostHog is initialized`() {
        // PostHog is not initialized in unit tests — should swallow exceptions gracefully
        AnalyticsTracker.capture("test_event")
    }

    @Test
    public fun `capture with properties does not throw`() {
        AnalyticsTracker.capture("test_event", mapOf("key" to "value"))
    }
}

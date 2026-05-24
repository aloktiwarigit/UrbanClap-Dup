package com.homeservices.technician.observability.analytics

import com.posthog.PostHog

public object AnalyticsTracker {
    public fun capture(
        event: String,
        properties: Map<String, Any> = emptyMap(),
    ) {
        runCatching { PostHog.capture(event, properties = properties) }
    }
}

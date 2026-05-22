package com.homeservices.customer.observability.analytics

public interface AnalyticsFacade {
    public fun track(event: String, properties: Map<String, Any> = emptyMap())
    public fun identify(userId: String, traits: Map<String, Any> = emptyMap())
    public fun reset()
}

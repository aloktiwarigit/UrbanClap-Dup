package com.homeservices.customer.observability.analytics

import javax.inject.Inject

public class NoOpAnalyticsFacade
    @Inject
    constructor() : AnalyticsFacade {
        override fun track(
            event: String,
            properties: Map<String, Any>,
        ): Unit = Unit

        override fun identify(
            userId: String,
            traits: Map<String, Any>,
        ): Unit = Unit

        override fun reset(): Unit = Unit
    }

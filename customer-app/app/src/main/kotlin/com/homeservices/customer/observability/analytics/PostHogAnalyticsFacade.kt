package com.homeservices.customer.observability.analytics

import android.content.Context
import com.homeservices.customer.di.BuildInfoProvider
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PostHogAnalyticsFacade
    @Inject
    constructor(
        @ApplicationContext private val context: Context,
        private val buildInfoProvider: BuildInfoProvider,
    ) : AnalyticsFacade {
        @Volatile private var posthogReady: Boolean = false

        /**
         * Initializes PostHog if [analyticsOptIn] is true and initialization has not yet occurred.
         * Skips silently when the API key is blank (CI / local dev without a key).
         * Safe to call multiple times — only the first call with [analyticsOptIn]=true takes effect.
         */
        public fun initIfConsented(analyticsOptIn: Boolean) {
            if (analyticsOptIn && !posthogReady) {
                val apiKey = buildInfoProvider.postHogApiKey
                if (apiKey.isBlank()) return
                PostHogAndroid.setup(context, PostHogAndroidConfig(apiKey, "https://app.posthog.com"))
                posthogReady = true
            }
        }

        override fun track(event: String, properties: Map<String, Any>) {
            if (!posthogReady) return
            runCatching {
                PostHog.capture(event, properties = properties)
            }
        }

        override fun identify(userId: String, traits: Map<String, Any>) {
            if (!posthogReady) return
            runCatching {
                PostHog.identify(userId, userProperties = traits)
            }
        }

        override fun reset() {
            if (!posthogReady) return
            runCatching {
                PostHog.reset()
            }
        }
    }

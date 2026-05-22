package com.homeservices.customer.observability.analytics

import android.content.Context
import com.homeservices.customer.di.BuildInfoProvider
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.atomic.AtomicBoolean
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
public class PostHogAnalyticsFacade
    @Inject
    constructor(
        @ApplicationContext private val context: Context,
        private val buildInfoProvider: BuildInfoProvider,
    ) : AnalyticsFacade {
        private val posthogInitialized = AtomicBoolean(false)

        /**
         * Initializes PostHog if [analyticsOptIn] is true and initialization has not yet occurred.
         * Skips silently when the API key is blank (CI / local dev without a key).
         * Safe to call multiple times — only the first call with [analyticsOptIn]=true takes effect.
         * Thread-safe: uses compareAndSet to prevent double-initialization under concurrent calls.
         */
        public fun initIfConsented(analyticsOptIn: Boolean) {
            if (!analyticsOptIn || !posthogInitialized.compareAndSet(false, true)) return
            val apiKey = buildInfoProvider.postHogApiKey
            if (apiKey.isBlank()) {
                posthogInitialized.set(false) // allow retry if key becomes available
                return
            }
            PostHogAndroid.setup(context, PostHogAndroidConfig(apiKey, "https://app.posthog.com"))
        }

        override fun track(
            event: String,
            properties: Map<String, Any>,
        ) {
            if (!posthogInitialized.get()) return
            runCatching {
                PostHog.capture(event, properties = properties)
            }
        }

        override fun identify(
            userId: String,
            traits: Map<String, Any>,
        ) {
            if (!posthogInitialized.get()) return
            runCatching {
                PostHog.identify(userId, userProperties = traits)
            }
        }

        override fun reset() {
            if (!posthogInitialized.get()) return
            runCatching {
                PostHog.reset()
            }
        }
    }

package com.homeservices.customer.domain.flags

import com.homeservices.customer.BuildConfig
import com.sdk.growthbook.GBSDKBuilder
import com.sdk.growthbook.GrowthBookSDK
import com.sdk.growthbook.model.GBValue
import com.sdk.growthbook.network.GBNetworkDispatcherOkHttp
import javax.inject.Inject
import javax.inject.Singleton

/**
 * GrowthBook-backed [FeatureFlags] implementation.
 *
 * Uses the GrowthBook Cloud Free SDK (v7+). The client key is read from
 * [BuildConfig.GROWTHBOOK_CLIENT_KEY] which is populated from the
 * `GROWTHBOOK_CLIENT_KEY` environment variable at build time.
 *
 * When the key is blank (CI, local dev without a key), the SDK is instantiated
 * with `enabled = false` and `cachingEnabled = false` so no network calls or disk
 * I/O are made and every flag safely defaults to `false`. This is also the safe
 * posture in JVM unit tests (where Android caching would otherwise require a Context).
 *
 * [refreshAsync] is a fire-and-forget call that triggers a background CDN fetch
 * to pull the latest feature definitions. Failures are silently swallowed — the
 * last-cached (or default-off) posture is retained.
 *
 * E13-S05 — wires the real SDK, replacing [BuildConfigFeatureFlags].
 */
@Singleton
public class GrowthBookFeatureFlags
    @Inject
    constructor() : FeatureFlags {
        private val keyPresent: Boolean = BuildConfig.GROWTHBOOK_CLIENT_KEY.isNotBlank()

        private val sdk: GrowthBookSDK =
            GBSDKBuilder(
                apiKey = BuildConfig.GROWTHBOOK_CLIENT_KEY.ifBlank { "placeholder" },
                apiHost = "https://cdn.growthbook.io",
                attributes = emptyMap<String, GBValue>(),
                trackingCallback = { _, _ -> },
                networkDispatcher = GBNetworkDispatcherOkHttp(),
                // Disable caching when key is blank so Android's CachingImpl never requires
                // a Context (safe in unit tests and CI without a live key).
                cachingEnabled = keyPresent,
            ).setEnabled(keyPresent)
                .initialize()

        /**
         * Triggers a non-blocking background refresh of GrowthBook feature definitions
         * from the CDN. Should be called once from the Application class after startup.
         * Any network or parse error is silently ignored — the SDK retains its last-known
         * state (defaulting to OFF when no cached state is available).
         */
        public fun refreshAsync() {
            if (keyPresent) sdk.refreshCache()
        }

        override fun truecallerServerVerify(): Boolean = sdk.isOn("truecaller_server_verify_v2") ?: false

        override fun dpdpSelfServiceEnabled(): Boolean = sdk.isOn("customer.dpdp-self-service.enabled") ?: false

        override fun walletVisible(): Boolean = sdk.isOn("customer.wallet.visible") ?: false

        override fun photoFirstCatalogueEnabled(): Boolean = sdk.isOn("customer.photo-first-catalogue.enabled") ?: false
    }

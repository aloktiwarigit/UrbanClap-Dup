package com.homeservices.customer.domain.flags

import javax.inject.Inject

/**
 * Feature flag abstraction.
 *
 * Default implementation reads from BuildConfig boolean constants (always returns
 * `false` for flags not yet set to `true` in build.gradle). This keeps CI green
 * without requiring a live GrowthBook connection.
 *
 * The GrowthBook-backed implementation is wired in E13-S05 (Wave 2).
 */
public interface FeatureFlags {
    /**
     * When `true`, the Truecaller auth flow uses server-side RSA signature
     * verification (ADR-0005 Phase 2). When `false`, the original anonymous
     * sign-in path is used.
     *
     * Flag name: `truecaller_server_verify_v2`
     * Default: OFF (false)
     */
    public fun truecallerServerVerify(): Boolean

    /**
     * When `true`, the DPDP self-service delete-account flow is visible
     * in Settings → Privacy & data. When `false`, the entry point is hidden
     * (the code is compiled in but unreachable from the UI).
     *
     * Flag name: `customer.dpdp-self-service.enabled`
     * Default: OFF (false) — flipped ON after Week 2 exit / Play Store submission.
     */
    public fun dpdpSelfServiceEnabled(): Boolean

    /**
     * When `true`, the wallet balance chip on HomeScreen and the WalletScreen
     * are visible to the customer. When `false`, the entry point is hidden.
     *
     * Flag name: `customer.wallet.visible`
     * Default: OFF (false) — flipped ON after E13-S02 rollout.
     */
    public fun walletVisible(): Boolean
}

/**
 * Default implementation: reads BuildConfig flags. Returns `false` for all
 * flags until overridden. Safe for CI, unit tests, and the flag-OFF prod path.
 */
public class BuildConfigFeatureFlags
    @Inject
    constructor() : FeatureFlags {
        override fun truecallerServerVerify(): Boolean = TRUECALLER_SERVER_VERIFY_V2_ENABLED

        override fun dpdpSelfServiceEnabled(): Boolean = false

        override fun walletVisible(): Boolean = false

        private companion object {
            /**
             * Set via build.gradle `buildConfigField` when the flag should be hardcoded ON
             * for testing builds. Production defaults to false; the live value comes from
             * GrowthBook once E13-S05 wires the GrowthBook FeatureFlags impl.
             */
            const val TRUECALLER_SERVER_VERIFY_V2_ENABLED: Boolean = false
        }
    }

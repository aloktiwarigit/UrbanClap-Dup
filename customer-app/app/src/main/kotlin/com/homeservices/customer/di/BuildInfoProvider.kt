package com.homeservices.customer.di

import com.homeservices.customer.BuildConfig
import javax.inject.Singleton

@Singleton
public class BuildInfoProvider(
    public val version: String,
    public val gitSha: String,
) {
    public val shortSha: String
        get() = if (gitSha.length <= SHORT_SHA_LENGTH) gitSha else gitSha.substring(0, SHORT_SHA_LENGTH)

    /** PostHog project API key. Empty string in CI/debug builds without a key — init is skipped when blank. */
    public val postHogApiKey: String = BuildConfig.POSTHOG_API_KEY

    private companion object {
        const val SHORT_SHA_LENGTH: Int = 8
    }
}

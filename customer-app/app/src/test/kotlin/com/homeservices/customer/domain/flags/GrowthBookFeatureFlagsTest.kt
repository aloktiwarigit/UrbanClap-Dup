package com.homeservices.customer.domain.flags

import com.homeservices.customer.observability.analytics.AnalyticsFacade
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * GrowthBookFeatureFlags — unit tests.
 *
 * When a GrowthBook instance is constructed with an empty features map (no live CDN
 * fetch), every feature evaluation must default to OFF (false). This guards the
 * safe-off invariant required by ADR-0005 and ensures CI never fails due to a missing
 * GROWTHBOOK_CLIENT_KEY.
 */
public class GrowthBookFeatureFlagsTest {
    /** Minimal dagger.Lazy wrapper backed by a no-op analytics facade. */
    private val noOpLazy: dagger.Lazy<AnalyticsFacade> = dagger.Lazy { NoOpAnalyticsFacade() }

    @Test
    public fun `truecallerServerVerify defaults to false without features`() {
        // SUT constructed without a live SDK fetch — features map is empty.
        val sut = GrowthBookFeatureFlags(analytics = noOpLazy)

        assertThat(sut.truecallerServerVerify()).isFalse()
    }

    @Test
    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
        val sut: FeatureFlags = GrowthBookFeatureFlags(analytics = noOpLazy)

        // Interface contract: the result is a Boolean (non-null).
        // Boolean::class.javaObjectType resolves to java.lang.Boolean (the boxed type),
        // which is what AssertJ sees at runtime on the JVM.
        assertThat(sut.truecallerServerVerify()).isInstanceOf(Boolean::class.javaObjectType)
    }
}

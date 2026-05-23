package com.homeservices.customer.domain.flags

import com.homeservices.customer.observability.analytics.AnalyticsFacade
import com.homeservices.customer.observability.analytics.NoOpAnalyticsFacade
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * E16-S03 — Feature flag tests for photo-first catalogue flag.
 *
 * Verifies the safe-off default for both the BuildConfig and GrowthBook implementations.
 */
public class PhotoFirstCatalogueFeatureFlagTest {
    private val noOpLazy: dagger.Lazy<AnalyticsFacade> = dagger.Lazy { NoOpAnalyticsFacade() }

    @Test
    public fun `BuildConfigFeatureFlags photoFirstCatalogueEnabled defaults to false`() {
        val sut = BuildConfigFeatureFlags()
        assertThat(sut.photoFirstCatalogueEnabled()).isFalse()
    }

    @Test
    public fun `GrowthBookFeatureFlags photoFirstCatalogueEnabled defaults to false without live SDK`() {
        val sut = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
        assertThat(sut.photoFirstCatalogueEnabled()).isFalse()
    }

    @Test
    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
        val sut: FeatureFlags = GrowthBookFeatureFlags(apiKey = "", analytics = noOpLazy)
        assertThat(sut.photoFirstCatalogueEnabled()).isInstanceOf(Boolean::class.javaObjectType)
    }
}

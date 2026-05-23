package com.homeservices.customer.domain.flags

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * E16-S03 — Feature flag tests for photo-first catalogue flag.
 *
 * Verifies the safe-off default for both the BuildConfig and GrowthBook implementations.
 */
public class PhotoFirstCatalogueFeatureFlagTest {
    @Test
    public fun `BuildConfigFeatureFlags photoFirstCatalogueEnabled defaults to false`() {
        val sut = BuildConfigFeatureFlags()
        assertThat(sut.photoFirstCatalogueEnabled()).isFalse()
    }

    @Test
    public fun `GrowthBookFeatureFlags photoFirstCatalogueEnabled defaults to false without live SDK`() {
        val sut = GrowthBookFeatureFlags()
        assertThat(sut.photoFirstCatalogueEnabled()).isFalse()
    }

    @Test
    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
        val sut: FeatureFlags = GrowthBookFeatureFlags()
        assertThat(sut.photoFirstCatalogueEnabled()).isInstanceOf(Boolean::class.javaObjectType)
    }
}

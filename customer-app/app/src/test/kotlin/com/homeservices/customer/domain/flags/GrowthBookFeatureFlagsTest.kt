package com.homeservices.customer.domain.flags

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * GrowthBookFeatureFlags — unit tests.
 *
 * Constructs the SDK with an empty API key so no BuildConfig access is needed
 * and no network/disk I/O is performed. With an empty key the SDK is disabled
 * (`setEnabled(false)`) and every flag must safely default to false — the
 * safe-off invariant required by ADR-0005.
 */
public class GrowthBookFeatureFlagsTest {

    @Test
    public fun `all flags return false when api key is blank`() {
        val flags = GrowthBookFeatureFlags(apiKey = "")
        assertThat(flags.truecallerServerVerify()).isFalse()
    }

    @Test
    public fun `refreshAsync does not throw when key is blank`() {
        val flags = GrowthBookFeatureFlags(apiKey = "")
        flags.refreshAsync() // no-op when keyPresent is false; must not throw
    }

    @Test
    public fun `GrowthBookFeatureFlags implements FeatureFlags interface`() {
        val sut: FeatureFlags = GrowthBookFeatureFlags(apiKey = "")

        // Interface contract: the result is a Boolean (non-null).
        // Boolean::class.javaObjectType resolves to java.lang.Boolean (the boxed type),
        // which is what AssertJ sees at runtime on the JVM.
        assertThat(sut.truecallerServerVerify()).isInstanceOf(Boolean::class.javaObjectType)
    }
}

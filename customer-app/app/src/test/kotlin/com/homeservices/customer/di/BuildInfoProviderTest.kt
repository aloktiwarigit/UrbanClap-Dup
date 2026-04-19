package com.homeservices.customer.di

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class BuildInfoProviderTest {
    @Test
    public fun `shortSha returns first 8 characters of a 40-char sha`(): Unit {
        val provider = BuildInfoProvider(version = "0.1.0", gitSha = "abcdef1234567890abcdef1234567890abcdef12")

        assertThat(provider.shortSha).isEqualTo("abcdef12")
    }

    @Test
    public fun `shortSha returns dev literal when gitSha is dev`(): Unit {
        val provider = BuildInfoProvider(version = "0.1.0", gitSha = "dev")

        assertThat(provider.shortSha).isEqualTo("dev")
    }

    @Test
    public fun `shortSha returns whole sha when shorter than 8 characters`(): Unit {
        val provider = BuildInfoProvider(version = "0.1.0", gitSha = "abc")

        assertThat(provider.shortSha).isEqualTo("abc")
    }

    @Test
    public fun `version is exposed unchanged`(): Unit {
        val provider = BuildInfoProvider(version = "0.1.0", gitSha = "dev")

        assertThat(provider.version).isEqualTo("0.1.0")
    }
}

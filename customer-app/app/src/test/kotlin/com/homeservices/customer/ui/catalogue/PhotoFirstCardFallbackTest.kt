package com.homeservices.customer.ui.catalogue

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * E16-S03 — Unit tests for the [shouldRenderCdnImage] helper used by both
 * photo-first card composables to decide between rendering an [coil.compose.AsyncImage]
 * vs. the icon/initials fallback.
 */
public class PhotoFirstCardFallbackTest {
    @Test
    public fun `blank URL falls back (no Coil request issued)`() {
        assertThat(shouldRenderCdnImage("")).isFalse()
    }

    @Test
    public fun `whitespace-only URL falls back`() {
        assertThat(shouldRenderCdnImage("   ")).isFalse()
    }

    @Test
    public fun `valid HTTPS CDN URL triggers image render`() {
        assertThat(shouldRenderCdnImage("https://cdn.example.com/s.jpg")).isTrue()
    }
}

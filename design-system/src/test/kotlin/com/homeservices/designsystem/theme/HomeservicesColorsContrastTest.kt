package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * WCAG 2.1 AA contrast verification for every (foreground, background) pair in both ColorSchemes.
 *
 * AA thresholds:
 *   - Normal text (< 18pt regular / < 14pt bold): contrast ≥ 4.5:1
 *   - Large text  (≥ 18pt regular / ≥ 14pt bold): contrast ≥ 3.0:1
 *
 * The [onSurfaceVariant] / [surfaceVariant] pair is designated "large/secondary text" per
 * UX §11.2 / NFR-A-5 and is therefore checked at the 3.0:1 large-text threshold only.
 */
internal class HomeservicesColorsContrastTest {
    @Nested
    internal inner class LightColorScheme {
        @Test
        internal fun onPrimary_over_primary_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onPrimary,
                    HomeservicesLightColorScheme.primary,
                )
            assertThat(ratio)
                .`as`("onPrimary/primary contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onPrimaryContainer_over_primaryContainer_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onPrimaryContainer,
                    HomeservicesLightColorScheme.primaryContainer,
                )
            assertThat(ratio)
                .`as`("onPrimaryContainer/primaryContainer contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onSecondary_over_secondary_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onSecondary,
                    HomeservicesLightColorScheme.secondary,
                )
            assertThat(ratio)
                .`as`("onSecondary/secondary contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onBackground_over_background_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onBackground,
                    HomeservicesLightColorScheme.background,
                )
            assertThat(ratio)
                .`as`("onBackground/background contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onSurface_over_surface_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onSurface,
                    HomeservicesLightColorScheme.surface,
                )
            assertThat(ratio)
                .`as`("onSurface/surface contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        /**
         * onSurfaceVariant / surfaceVariant — large/secondary text slot (UX §11.2 / NFR-A-5).
         * AA large-text threshold is 3.0:1. Neutral-500 (#71717A) on Neutral-100 (#F4F4F5)
         * is intentionally below 4.5:1 as it targets secondary labels and captions at ≥18pt.
         */
        @Test
        internal fun onSurfaceVariant_over_surfaceVariant_meetsAA_largeText() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onSurfaceVariant,
                    HomeservicesLightColorScheme.surfaceVariant,
                )
            assertThat(ratio)
                .`as`(
                    "onSurfaceVariant/surfaceVariant contrast = %.2f (large-text slot, need ≥3.0)",
                    ratio,
                ).isGreaterThanOrEqualTo(3.0)
        }

        @Test
        internal fun onError_over_error_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onError,
                    HomeservicesLightColorScheme.error,
                )
            assertThat(ratio)
                .`as`("onError/error contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }
    }

    @Nested
    internal inner class DarkColorScheme {
        @Test
        internal fun onPrimary_over_primary_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onPrimary,
                    HomeservicesDarkColorScheme.primary,
                )
            assertThat(ratio)
                .`as`("dark onPrimary/primary contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onPrimaryContainer_over_primaryContainer_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onPrimaryContainer,
                    HomeservicesDarkColorScheme.primaryContainer,
                )
            assertThat(ratio)
                .`as`("dark onPrimaryContainer/primaryContainer contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onSecondary_over_secondary_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onSecondary,
                    HomeservicesDarkColorScheme.secondary,
                )
            assertThat(ratio)
                .`as`("dark onSecondary/secondary contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onBackground_over_background_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onBackground,
                    HomeservicesDarkColorScheme.background,
                )
            assertThat(ratio)
                .`as`("dark onBackground/background contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        @Test
        internal fun onSurface_over_surface_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onSurface,
                    HomeservicesDarkColorScheme.surface,
                )
            assertThat(ratio)
                .`as`("dark onSurface/surface contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }

        /**
         * onSurfaceVariant / surfaceVariant — large/secondary text slot (UX §11.2 / NFR-A-5).
         * Neutral-500-dark (#9CA3AF) on Neutral-100-dark (#1D1F23) — large-text AA threshold.
         */
        @Test
        internal fun onSurfaceVariant_over_surfaceVariant_meetsAA_largeText() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onSurfaceVariant,
                    HomeservicesDarkColorScheme.surfaceVariant,
                )
            assertThat(ratio)
                .`as`(
                    "dark onSurfaceVariant/surfaceVariant contrast = %.2f (large-text slot, need ≥3.0)",
                    ratio,
                ).isGreaterThanOrEqualTo(3.0)
        }

        @Test
        internal fun onError_over_error_meetsAA() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onError,
                    HomeservicesDarkColorScheme.error,
                )
            assertThat(ratio)
                .`as`("dark onError/error contrast = %.2f (need ≥4.5)", ratio)
                .isGreaterThanOrEqualTo(4.5)
        }
    }
}

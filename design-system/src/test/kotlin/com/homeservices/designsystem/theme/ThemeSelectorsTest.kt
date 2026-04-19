package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Exercises the pure dark-mode-selection helpers that back [HomeservicesTheme].
 * These cover the `if (darkTheme)` branches under Kover, since the @Composable
 * wrapper itself runs under Paparazzi's layoutlib (B10 — Kover can't credit it).
 */
internal class ThemeSelectorsTest {
    @Test
    internal fun selectColorScheme_lightReturnsLightScheme() {
        assertThat(selectColorScheme(darkTheme = false)).isSameAs(HomeservicesLightColorScheme)
    }

    @Test
    internal fun selectColorScheme_darkReturnsDarkScheme() {
        assertThat(selectColorScheme(darkTheme = true)).isSameAs(HomeservicesDarkColorScheme)
    }

    @Test
    internal fun selectExtendedColors_lightReturnsLightVariant() {
        assertThat(selectExtendedColors(darkTheme = false)).isSameAs(HomeservicesExtendedColorsLight)
    }

    @Test
    internal fun selectExtendedColors_darkReturnsDarkVariant() {
        assertThat(selectExtendedColors(darkTheme = true)).isSameAs(HomeservicesExtendedColorsDark)
    }
}

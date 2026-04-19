package com.homeservices.designsystem.theme

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts every UX §5.2 TextStyle value for [HomeservicesTypography].
 *
 * Each test covers one token row: fontSize, lineHeight, fontWeight, and fontFamily identity.
 * fontFamily identity is a pure JVM reference compare — no Android runtime is required.
 * Actual typeface loading (variable-font axis) is verified end-to-end in T6 Paparazzi tests.
 */
internal class TypographyTokensTest {
    @Test
    internal fun displayLarge_matchesUxDisplayXl() {
        val style = HomeservicesTypography.displayLarge
        assertThat(style.fontSize.value).isEqualTo(48f)
        assertThat(style.lineHeight.value).isEqualTo(56f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.Bold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun displayMedium_matchesUxDisplayLg() {
        val style = HomeservicesTypography.displayMedium
        assertThat(style.fontSize.value).isEqualTo(40f)
        assertThat(style.lineHeight.value).isEqualTo(48f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.Bold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun headlineLarge_matchesUxTitleLg() {
        val style = HomeservicesTypography.headlineLarge
        assertThat(style.fontSize.value).isEqualTo(28f)
        assertThat(style.lineHeight.value).isEqualTo(36f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.SemiBold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun headlineMedium_matchesUxTitleMd() {
        val style = HomeservicesTypography.headlineMedium
        assertThat(style.fontSize.value).isEqualTo(22f)
        assertThat(style.lineHeight.value).isEqualTo(30f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.SemiBold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun titleLarge_matchesUxTitleSm() {
        val style = HomeservicesTypography.titleLarge
        assertThat(style.fontSize.value).isEqualTo(18f)
        assertThat(style.lineHeight.value).isEqualTo(26f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.SemiBold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun bodyLarge_matchesUxBodyLg() {
        val style = HomeservicesTypography.bodyLarge
        assertThat(style.fontSize.value).isEqualTo(16f)
        assertThat(style.lineHeight.value).isEqualTo(24f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.Normal)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun bodyMedium_matchesUxBodyMd() {
        val style = HomeservicesTypography.bodyMedium
        assertThat(style.fontSize.value).isEqualTo(14f)
        assertThat(style.lineHeight.value).isEqualTo(22f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.Normal)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun bodySmall_matchesUxBodySm() {
        val style = HomeservicesTypography.bodySmall
        assertThat(style.fontSize.value).isEqualTo(12f)
        assertThat(style.lineHeight.value).isEqualTo(18f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.Medium)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun labelLarge_matchesUxLabelLg() {
        val style = HomeservicesTypography.labelLarge
        assertThat(style.fontSize.value).isEqualTo(14f)
        assertThat(style.lineHeight.value).isEqualTo(20f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.SemiBold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun labelSmall_matchesUxLabelSm() {
        val style = HomeservicesTypography.labelSmall
        assertThat(style.fontSize.value).isEqualTo(11f)
        assertThat(style.lineHeight.value).isEqualTo(16f)
        assertThat(style.fontWeight).isEqualTo(FontWeight.SemiBold)
        assertThat(style.fontFamily).isSameAs(HomeservicesFontFamily)
    }

    @Test
    internal fun fontFamily_isNonNull() {
        assertThat(HomeservicesFontFamily).isNotNull()
        assertThat(HomeservicesFontFamily).isInstanceOf(FontFamily::class.java)
    }
}

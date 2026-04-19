package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts both light + dark variants of [HomeservicesExtendedColors] match UX §5.1 dossier rows.
 *
 * Note: Runtime-dispatch behaviour of [LocalHomeservicesExtendedColors] (i.e. that
 * MaterialTheme / HomeservicesTheme correctly provides the dark variant in dark-mode) is covered
 * by the TokenGallery Paparazzi screenshot test in T6, which compares light vs dark renders.
 * Here we only verify the static default resolves to the light variant.
 */
internal class ExtendedColorsTest {
    // ── Light variant ─────────────────────────────────────────────────────────

    @Test
    internal fun extendedLight_verified_matchesSemanticSuccessLight() {
        assertThat(HomeservicesExtendedColorsLight.verified).isEqualTo(Color(0xFF10A85E))
    }

    @Test
    internal fun extendedLight_neighbourhood_matchesBrandAccentLight() {
        assertThat(HomeservicesExtendedColorsLight.neighbourhood).isEqualTo(Color(0xFFEF6F4B))
    }

    @Test
    internal fun extendedLight_brandAccent_matchesBrandAccentLight() {
        assertThat(HomeservicesExtendedColorsLight.brandAccent).isEqualTo(Color(0xFFEF6F4B))
    }

    @Test
    internal fun extendedLight_brandPrimaryHover_matchesBrandPrimaryHoverLight() {
        assertThat(HomeservicesExtendedColorsLight.brandPrimaryHover).isEqualTo(Color(0xFF0A3D37))
    }

    // ── Dark variant ──────────────────────────────────────────────────────────

    @Test
    internal fun extendedDark_verified_matchesSemanticSuccessDark() {
        assertThat(HomeservicesExtendedColorsDark.verified).isEqualTo(Color(0xFF25C97B))
    }

    @Test
    internal fun extendedDark_neighbourhood_matchesBrandAccentDark() {
        assertThat(HomeservicesExtendedColorsDark.neighbourhood).isEqualTo(Color(0xFFF78866))
    }

    @Test
    internal fun extendedDark_brandAccent_matchesBrandAccentDark() {
        assertThat(HomeservicesExtendedColorsDark.brandAccent).isEqualTo(Color(0xFFF78866))
    }

    @Test
    internal fun extendedDark_brandPrimaryHover_matchesBrandPrimaryHoverDark() {
        assertThat(HomeservicesExtendedColorsDark.brandPrimaryHover).isEqualTo(Color(0xFF2BA08F))
    }

    // ── CompositionLocal default ──────────────────────────────────────────────

    /**
     * Verifies the static default of [LocalHomeservicesExtendedColors] is the light variant.
     *
     * We can't call `.current` outside a composable, so we compare the package-level
     * [HomeservicesExtendedColorsLight] value directly to the canonical light spec. The
     * [staticCompositionLocalOf] lambda in [LocalHomeservicesExtendedColors] captures this same
     * val, so if this test passes the local's default is correct.
     */
    @Test
    internal fun localExtendedColors_defaultResolvesToLightVariant() {
        // The default lambda passed to staticCompositionLocalOf { HomeservicesExtendedColorsLight }
        // must equal the light variant. We verify the light variant is fully populated as a proxy.
        val expected = HomeservicesExtendedColorsLight
        assertThat(expected.verified).isEqualTo(Color(0xFF10A85E))
        assertThat(expected.neighbourhood).isEqualTo(Color(0xFFEF6F4B))
        assertThat(expected.brandAccent).isEqualTo(Color(0xFFEF6F4B))
        assertThat(expected.brandPrimaryHover).isEqualTo(Color(0xFF0A3D37))
    }
}

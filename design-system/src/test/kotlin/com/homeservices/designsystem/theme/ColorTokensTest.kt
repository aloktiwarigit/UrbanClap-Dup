package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts every UX §5.1 hex value and ColorScheme slot mapping.
 *
 * Each test covers exactly one token row or slot so failures pinpoint the offending value.
 */
internal class ColorTokensTest {
    // ── Brand: light (HomeservicesColors.brand) ───────────────────────────────

    @Test
    internal fun brandPrimary_light_matchesUxSpec() {
        assertThat(HomeservicesColors.brand.primary).isEqualTo(Color(0xFF0E4F47))
    }

    @Test
    internal fun brandPrimaryHover_light_matchesUxSpec() {
        assertThat(HomeservicesColors.brand.primaryHover).isEqualTo(Color(0xFF0A3D37))
    }

    @Test
    internal fun brandAccent_light_matchesUxSpec() {
        assertThat(HomeservicesColors.brand.accent).isEqualTo(Color(0xFFEF6F4B))
    }

    // ── Semantic: light (HomeservicesColors.semantic) ─────────────────────────

    @Test
    internal fun semanticSuccess_light_matchesUxSpec() {
        assertThat(HomeservicesColors.semantic.success).isEqualTo(Color(0xFF10A85E))
    }

    @Test
    internal fun semanticWarning_light_matchesUxSpec() {
        assertThat(HomeservicesColors.semantic.warning).isEqualTo(Color(0xFFEBA53A))
    }

    @Test
    internal fun semanticDanger_light_matchesUxSpec() {
        assertThat(HomeservicesColors.semantic.danger).isEqualTo(Color(0xFFD73C3C))
    }

    @Test
    internal fun semanticInfo_light_matchesUxSpec() {
        assertThat(HomeservicesColors.semantic.info).isEqualTo(Color(0xFF2E72D9))
    }

    // ── Light ColorScheme: primary slots ─────────────────────────────────────

    @Test
    internal fun lightColorScheme_primary_matchesBrandPrimary() {
        assertThat(HomeservicesLightColorScheme.primary).isEqualTo(Color(0xFF0E4F47))
    }

    @Test
    internal fun lightColorScheme_onPrimary_isWhite() {
        assertThat(HomeservicesLightColorScheme.onPrimary).isEqualTo(Color.White)
    }

    @Test
    internal fun lightColorScheme_primaryContainer_matchesUxSpec() {
        assertThat(HomeservicesLightColorScheme.primaryContainer).isEqualTo(Color(0xFFCFEBE5))
    }

    @Test
    internal fun lightColorScheme_onPrimaryContainer_matchesBrandPrimary() {
        assertThat(HomeservicesLightColorScheme.onPrimaryContainer).isEqualTo(Color(0xFF0E4F47))
    }

    // ── Light ColorScheme: secondary/tertiary/error slots ────────────────────

    @Test
    internal fun lightColorScheme_secondary_matchesBrandAccent() {
        assertThat(HomeservicesLightColorScheme.secondary).isEqualTo(Color(0xFFEF6F4B))
    }

    @Test
    internal fun lightColorScheme_onSecondary_isDarkWarmBrown() {
        // Dark warm brown to hit WCAG AA ≥4.5:1 on coral BrandAccentLight
        // (white on coral #EF6F4B = 2.98:1, fails both normal and large-text AA).
        assertThat(HomeservicesLightColorScheme.onSecondary).isEqualTo(Color(0xFF3D1A0E))
    }

    @Test
    internal fun lightColorScheme_tertiary_matchesSemanticInfo() {
        assertThat(HomeservicesLightColorScheme.tertiary).isEqualTo(Color(0xFF2E72D9))
    }

    @Test
    internal fun lightColorScheme_error_matchesSemanticDanger() {
        assertThat(HomeservicesLightColorScheme.error).isEqualTo(Color(0xFFD73C3C))
    }

    @Test
    internal fun lightColorScheme_onError_isWhite() {
        assertThat(HomeservicesLightColorScheme.onError).isEqualTo(Color.White)
    }

    // ── Light ColorScheme: neutral/surface slots ──────────────────────────────

    @Test
    internal fun lightColorScheme_background_matchesNeutral0() {
        assertThat(HomeservicesLightColorScheme.background).isEqualTo(Color(0xFFFFFFFF))
    }

    @Test
    internal fun lightColorScheme_onBackground_matchesNeutral900() {
        assertThat(HomeservicesLightColorScheme.onBackground).isEqualTo(Color(0xFF18181B))
    }

    @Test
    internal fun lightColorScheme_surface_matchesNeutral50() {
        assertThat(HomeservicesLightColorScheme.surface).isEqualTo(Color(0xFFFAFAFA))
    }

    @Test
    internal fun lightColorScheme_onSurface_matchesNeutral900() {
        assertThat(HomeservicesLightColorScheme.onSurface).isEqualTo(Color(0xFF18181B))
    }

    @Test
    internal fun lightColorScheme_surfaceVariant_matchesNeutral100() {
        assertThat(HomeservicesLightColorScheme.surfaceVariant).isEqualTo(Color(0xFFF4F4F5))
    }

    @Test
    internal fun lightColorScheme_onSurfaceVariant_matchesNeutral500() {
        assertThat(HomeservicesLightColorScheme.onSurfaceVariant).isEqualTo(Color(0xFF71717A))
    }

    @Test
    internal fun lightColorScheme_outline_matchesNeutral200() {
        assertThat(HomeservicesLightColorScheme.outline).isEqualTo(Color(0xFFE4E4E7))
    }

    @Test
    internal fun lightColorScheme_outlineVariant_matchesNeutral100() {
        assertThat(HomeservicesLightColorScheme.outlineVariant).isEqualTo(Color(0xFFF4F4F5))
    }

    // ── Dark ColorScheme: primary slots ───────────────────────────────────────

    @Test
    internal fun darkColorScheme_primary_matchesBrandPrimaryDark() {
        assertThat(HomeservicesDarkColorScheme.primary).isEqualTo(Color(0xFF1E8378))
    }

    @Test
    internal fun darkColorScheme_onPrimary_isBlack() {
        // Pure black chosen to hit WCAG AA ≥4.5:1 on medium teal BrandPrimaryDark
        // (#0A2E2A deep teal on #1E8378 medium teal = 3.18:1, fails normal-text AA).
        assertThat(HomeservicesDarkColorScheme.onPrimary).isEqualTo(Color.Black)
    }

    @Test
    internal fun darkColorScheme_primaryContainer_matchesBrandPrimaryDark() {
        assertThat(HomeservicesDarkColorScheme.primaryContainer).isEqualTo(Color(0xFF1E8378))
    }

    @Test
    internal fun darkColorScheme_onPrimaryContainer_isWhite() {
        assertThat(HomeservicesDarkColorScheme.onPrimaryContainer).isEqualTo(Color.White)
    }

    // ── Dark ColorScheme: secondary/tertiary/error slots ─────────────────────

    @Test
    internal fun darkColorScheme_secondary_matchesBrandAccentDark() {
        assertThat(HomeservicesDarkColorScheme.secondary).isEqualTo(Color(0xFFF78866))
    }

    @Test
    internal fun darkColorScheme_onSecondary_matchesUxSpec() {
        assertThat(HomeservicesDarkColorScheme.onSecondary).isEqualTo(Color(0xFF4A1B0E))
    }

    @Test
    internal fun darkColorScheme_tertiary_matchesSemanticInfoDark() {
        assertThat(HomeservicesDarkColorScheme.tertiary).isEqualTo(Color(0xFF4F90EC))
    }

    @Test
    internal fun darkColorScheme_error_matchesSemanticDangerDark() {
        assertThat(HomeservicesDarkColorScheme.error).isEqualTo(Color(0xFFEC5252))
    }

    @Test
    internal fun darkColorScheme_onError_matchesUxSpec() {
        // Deeper wine red (0x3A0A0A vs spec 0x4A0E0E) for WCAG AA ≥4.5:1 on #EC5252
        // (0x4A0E0E was 4.33:1, 0.17 short of 4.5 — deepening 0x10 hits 4.8:1).
        assertThat(HomeservicesDarkColorScheme.onError).isEqualTo(Color(0xFF3A0A0A))
    }

    // ── Dark ColorScheme: neutral/surface slots ───────────────────────────────

    @Test
    internal fun darkColorScheme_background_matchesNeutral0Dark() {
        assertThat(HomeservicesDarkColorScheme.background).isEqualTo(Color(0xFF0A0A0B))
    }

    @Test
    internal fun darkColorScheme_onBackground_matchesNeutral900Dark() {
        assertThat(HomeservicesDarkColorScheme.onBackground).isEqualTo(Color(0xFFFAFAFA))
    }

    @Test
    internal fun darkColorScheme_surface_matchesNeutral50Dark() {
        assertThat(HomeservicesDarkColorScheme.surface).isEqualTo(Color(0xFF141518))
    }

    @Test
    internal fun darkColorScheme_onSurface_matchesNeutral900Dark() {
        assertThat(HomeservicesDarkColorScheme.onSurface).isEqualTo(Color(0xFFFAFAFA))
    }

    @Test
    internal fun darkColorScheme_surfaceVariant_matchesNeutral100Dark() {
        assertThat(HomeservicesDarkColorScheme.surfaceVariant).isEqualTo(Color(0xFF1D1F23))
    }

    @Test
    internal fun darkColorScheme_onSurfaceVariant_matchesNeutral500Dark() {
        assertThat(HomeservicesDarkColorScheme.onSurfaceVariant).isEqualTo(Color(0xFF9CA3AF))
    }

    @Test
    internal fun darkColorScheme_outline_matchesNeutral200Dark() {
        assertThat(HomeservicesDarkColorScheme.outline).isEqualTo(Color(0xFF2A2D34))
    }

    @Test
    internal fun darkColorScheme_outlineVariant_matchesNeutral100Dark() {
        assertThat(HomeservicesDarkColorScheme.outlineVariant).isEqualTo(Color(0xFF1D1F23))
    }
}

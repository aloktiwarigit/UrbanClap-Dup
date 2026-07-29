package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Semantic and M3-derived colour slots.
 *
 * **Scope note (S-10).** This file previously asserted every hex in the forest/brass palette —
 * brand, neutrals and surfaces — against `docs/ux-design.md` §5.1. Those roles are now owned by
 * [D1TokenCoreTest], which asserts them against `docs/design/design-language.md` (D1) together with
 * their published contrast ratios. The old assertions were deleted rather than updated: keeping two
 * files asserting the same roles is how a palette ends up with two sources of truth, which is the
 * exact failure D1 exists to resolve.
 *
 * What remains here is the part D1 did **not** change: the four semantic colours, which were the only
 * tokens that already agreed across the spec and both implementations, plus the M3 slots derived
 * from them.
 */
internal class ColorTokensTest {
    // ── Semantic tokens — unchanged by D1 ─────────────────────────────────────

    @Test
    internal fun semanticSuccess_light() {
        assertThat(HomeservicesColors.semantic.success).isEqualTo(Color(0xFF10A85E))
    }

    @Test
    internal fun semanticWarning_light() {
        assertThat(HomeservicesColors.semantic.warning).isEqualTo(Color(0xFFEBA53A))
    }

    @Test
    internal fun semanticDanger_light() {
        assertThat(HomeservicesColors.semantic.danger).isEqualTo(Color(0xFFD73C3C))
    }

    @Test
    internal fun semanticInfo_light() {
        assertThat(HomeservicesColors.semantic.info).isEqualTo(Color(0xFF2E72D9))
    }

    // ── Slots derived from semantic tokens ────────────────────────────────────

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

    @Test
    internal fun darkColorScheme_tertiary_matchesSemanticInfoDark() {
        assertThat(HomeservicesDarkColorScheme.tertiary).isEqualTo(Color(0xFF4F90EC))
    }

    @Test
    internal fun darkColorScheme_error_matchesSemanticDangerDark() {
        assertThat(HomeservicesDarkColorScheme.error).isEqualTo(Color(0xFFEC5252))
    }

    @Test
    internal fun darkColorScheme_onError_meetsAaOnDangerDark() {
        // Deeper wine red than the original spec value: 0x4A0E0E measured 4.33:1 on #EC5252,
        // 0.17 short of AA; deepening to 0x3A0A0A reaches 4.8:1.
        assertThat(HomeservicesDarkColorScheme.onError).isEqualTo(Color(0xFF3A0A0A))
    }

    // ── Accent identity ───────────────────────────────────────────────────────

    @Test
    internal fun the_accent_is_one_value_across_both_modes() {
        assertThat(HomeservicesColors.brand.accent)
            .`as`("a per-mode accent is how the previous palettes drifted apart")
            .isEqualTo(HomeservicesDarkColorScheme.primary)
        assertThat(HomeservicesColors.brand.accent).isEqualTo(HomeservicesLightColorScheme.primary)
    }
}

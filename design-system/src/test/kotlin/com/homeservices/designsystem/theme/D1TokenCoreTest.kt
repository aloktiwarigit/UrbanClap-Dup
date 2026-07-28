package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/**
 * S-10 — conformance of the token core to D1, the enforceable Phase 1 contract in
 * `docs/design/design-language.md`.
 *
 * Before this story the shipped Android palette was forest `#0B3D2E` / brass `#B68A2C` on warm cream,
 * which matched neither D1 nor `docs/ux-design.md` §5.1 — the header comments in `Color.kt` claimed
 * conformance to a spec the file did not implement. See `docs/design/uiux-audit-2026.md`.
 *
 * The contrast ratios asserted here are the *measured* values published in D1, so this file fails if
 * anyone changes a core role without re-deriving and re-publishing the pair.
 *
 * Accessibility floor is WCAG 2.2 AA (4.5:1 body). D2 targets 7:1 where practical because the field
 * context is outdoor sunlight on low-quality screens in rural Uttar Pradesh.
 */
internal class D1TokenCoreTest {
    private companion object {
        // D1 §Palette — core roles.
        val BRAND_ACCENT = Color(0xFFE2A04A)

        val CANVAS_LIGHT = Color(0xFFFBF6E9)
        val SURFACE_LIGHT = Color(0xFFF4EDDF)
        val SURFACE_RAISED_LIGHT = Color(0xFFE9DFC6)
        val TEXT_STRONG_LIGHT = Color(0xFF1A140F)
        val TEXT_MUTED_LIGHT = Color(0xFF4A4135)
        val TEXT_FAINT_LIGHT = Color(0xFF6E665B)
        val BORDER_LIGHT = Color(0xFFD4C9AB)
        val BORDER_STRONG_LIGHT = Color(0xFFB0A382)

        val CANVAS_DARK = Color(0xFF0E0B08)
        val SURFACE_DARK = Color(0xFF1A1610)
        val SURFACE_RAISED_DARK = Color(0xFF221C15)
        val TEXT_STRONG_DARK = Color(0xFFF1E9D8)
        val TEXT_MUTED_DARK = Color(0xFF9A9082)
        val TEXT_FAINT_DARK = Color(0xFF877A6D)
        val BORDER_DARK = Color(0xFF2E2719)
        val BORDER_STRONG_DARK = Color(0xFF3E3528)

        const val TOLERANCE = 0.15
    }

    @Nested
    internal inner class CoreRolesAreBoundToTheLightScheme {
        @Test
        internal fun brand_accent_is_marigold_not_forest_green() {
            assertThat(HomeservicesLightColorScheme.primary).isEqualTo(BRAND_ACCENT)
        }

        @Test
        internal fun canvas_is_warm_paper() {
            assertThat(HomeservicesLightColorScheme.background).isEqualTo(CANVAS_LIGHT)
        }

        @Test
        internal fun surface_and_raised_surface_are_distinct_steps() {
            assertThat(HomeservicesLightColorScheme.surface).isEqualTo(SURFACE_LIGHT)
            assertThat(HomeservicesLightColorScheme.surfaceVariant).isEqualTo(SURFACE_RAISED_LIGHT)
            assertThat(HomeservicesLightColorScheme.surface)
                .`as`("a raised surface must be visually separable from the base surface")
                .isNotEqualTo(HomeservicesLightColorScheme.surfaceVariant)
        }

        @Test
        internal fun text_roles_are_bound() {
            assertThat(HomeservicesLightColorScheme.onBackground).isEqualTo(TEXT_STRONG_LIGHT)
            assertThat(HomeservicesLightColorScheme.onSurface).isEqualTo(TEXT_STRONG_LIGHT)
            assertThat(HomeservicesLightColorScheme.onSurfaceVariant).isEqualTo(TEXT_MUTED_LIGHT)
        }

        @Test
        internal fun border_roles_are_bound() {
            assertThat(HomeservicesLightColorScheme.outlineVariant).isEqualTo(BORDER_LIGHT)
            assertThat(HomeservicesLightColorScheme.outline).isEqualTo(BORDER_STRONG_LIGHT)
        }
    }

    @Nested
    internal inner class CoreRolesAreBoundToTheDarkScheme {
        @Test
        internal fun brand_accent_is_the_same_marigold_in_both_modes() {
            assertThat(HomeservicesDarkColorScheme.primary)
                .`as`("D1 uses one accent across modes; it must not drift per-mode")
                .isEqualTo(BRAND_ACCENT)
        }

        @Test
        internal fun canvas_and_surfaces_are_warm_ink() {
            assertThat(HomeservicesDarkColorScheme.background).isEqualTo(CANVAS_DARK)
            assertThat(HomeservicesDarkColorScheme.surface).isEqualTo(SURFACE_DARK)
            assertThat(HomeservicesDarkColorScheme.surfaceVariant).isEqualTo(SURFACE_RAISED_DARK)
        }

        @Test
        internal fun text_and_border_roles_are_bound() {
            assertThat(HomeservicesDarkColorScheme.onBackground).isEqualTo(TEXT_STRONG_DARK)
            assertThat(HomeservicesDarkColorScheme.onSurface).isEqualTo(TEXT_STRONG_DARK)
            assertThat(HomeservicesDarkColorScheme.onSurfaceVariant).isEqualTo(TEXT_MUTED_DARK)
            assertThat(HomeservicesDarkColorScheme.outlineVariant).isEqualTo(BORDER_DARK)
            assertThat(HomeservicesDarkColorScheme.outline).isEqualTo(BORDER_STRONG_DARK)
        }
    }

    /**
     * The published ratios in D1 §Palette. Asserting the measured numbers — not merely ">= 4.5" —
     * means a silent tweak to any core role fails here instead of quietly degrading legibility.
     */
    @Nested
    internal inner class PublishedContrastRatiosHold {
        @Test
        internal fun light_text_strong_on_canvas_is_16_91() {
            assertThat(Wcag21Contrast.ratio(TEXT_STRONG_LIGHT, CANVAS_LIGHT))
                .isCloseTo(16.91, within(TOLERANCE))
        }

        @Test
        internal fun light_text_muted_on_canvas_is_9_27() {
            assertThat(Wcag21Contrast.ratio(TEXT_MUTED_LIGHT, CANVAS_LIGHT))
                .isCloseTo(9.27, within(TOLERANCE))
        }

        @Test
        internal fun light_text_faint_on_canvas_is_5_24() {
            assertThat(Wcag21Contrast.ratio(TEXT_FAINT_LIGHT, CANVAS_LIGHT))
                .isCloseTo(5.24, within(TOLERANCE))
        }

        @Test
        internal fun dark_text_strong_on_canvas_is_16_25() {
            assertThat(Wcag21Contrast.ratio(TEXT_STRONG_DARK, CANVAS_DARK))
                .isCloseTo(16.25, within(TOLERANCE))
        }

        @Test
        internal fun dark_text_muted_on_canvas_is_6_25() {
            assertThat(Wcag21Contrast.ratio(TEXT_MUTED_DARK, CANVAS_DARK))
                .isCloseTo(6.25, within(TOLERANCE))
        }

        @Test
        internal fun dark_text_faint_on_canvas_is_4_71() {
            assertThat(Wcag21Contrast.ratio(TEXT_FAINT_DARK, CANVAS_DARK))
                .isCloseTo(4.71, within(TOLERANCE))
        }

        /**
         * D1 publishes "Ink on brand accent — 8.39:1". That figure does not reproduce for any ink in
         * the palette: canvas-dark `#0E0B08` measures 8.748, text-strong `#1A140F` 8.134, and
         * surface-dark `#1A1610` 8.027. The other six published ratios reproduce to the decimal, so
         * this one entry is a documentation error rather than a palette problem.
         *
         * `onPrimary` binds to canvas-dark, the most legible of the three, so the asserted value is
         * the measured 8.75. `design-language.md` has been corrected to match.
         */
        @Test
        internal fun ink_on_brand_accent_is_8_75() {
            assertThat(Wcag21Contrast.ratio(CANVAS_DARK, BRAND_ACCENT))
                .`as`("the accent is a decision surface; its label must be strongly legible")
                .isCloseTo(8.75, within(TOLERANCE))
        }

        @Test
        internal fun the_bound_onPrimary_clears_the_field_target_on_the_accent() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onPrimary,
                    HomeservicesLightColorScheme.primary,
                )
            assertThat(ratio)
                .`as`("accent label = %.2f:1 (D2 sunlight target >= 7)", ratio)
                .isGreaterThanOrEqualTo(7.0)
        }
    }

    /**
     * The regression this story exists to close. `onSurfaceVariant` was `#5F6C66` on `#FFFDF8`
     * (~4.7:1) and was annotated in-code as "large-text per NFR-A-5" — i.e. knowingly sub-AA at body
     * size — while `docs/ux-design.md:188` asserted "Contrast ratios ≥ 4.5:1 enforced".
     * Secondary text is body text in this product and must clear the 7:1 D2 target.
     */
    @Nested
    internal inner class SecondaryTextIsBodySafe {
        @Test
        internal fun light_muted_text_clears_the_seven_to_one_field_target() {
            val ratio =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onSurfaceVariant,
                    HomeservicesLightColorScheme.background,
                )
            assertThat(ratio)
                .`as`("muted body text = %.2f:1 (D2 sunlight target ≥ 7)", ratio)
                .isGreaterThanOrEqualTo(7.0)
        }

        @Test
        internal fun muted_text_is_body_safe_on_its_own_surface_in_both_modes() {
            val light =
                Wcag21Contrast.ratio(
                    HomeservicesLightColorScheme.onSurfaceVariant,
                    HomeservicesLightColorScheme.surfaceVariant,
                )
            val dark =
                Wcag21Contrast.ratio(
                    HomeservicesDarkColorScheme.onSurfaceVariant,
                    HomeservicesDarkColorScheme.surfaceVariant,
                )
            assertThat(light)
                .`as`("light muted-on-raised = %.2f:1 (AA body ≥ 4.5)", light)
                .isGreaterThanOrEqualTo(4.5)
            assertThat(dark)
                .`as`("dark muted-on-raised = %.2f:1 (AA body ≥ 4.5)", dark)
                .isGreaterThanOrEqualTo(4.5)
        }
    }

    /**
     * D1 §Spacing canonical steps: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96.
     * The shipped scale was missing 20 and 40, which is one reason ~44% of `.dp` literals in both
     * apps sit off-scale — the scale simply had no value for those gaps.
     */
    @Test
    internal fun spacing_scale_covers_every_canonical_step() {
        val scale =
            listOf(
                HomeservicesSpacing.space0,
                HomeservicesSpacing.space1,
                HomeservicesSpacing.space2,
                HomeservicesSpacing.space3,
                HomeservicesSpacing.space4,
                HomeservicesSpacing.space5,
                HomeservicesSpacing.space6,
                HomeservicesSpacing.space8,
                HomeservicesSpacing.space10,
                HomeservicesSpacing.space12,
                HomeservicesSpacing.space16,
                HomeservicesSpacing.space24,
            ).map { it.value.toInt() }

        assertThat(scale)
            .`as`("D1 canonical spacing steps")
            .containsExactly(0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96)
    }

    /**
     * TOK-003 — the module had no size/height token category, so spacing tokens were borrowed as a
     * stand-in and produced three different button heights (64 / 48 / 52) from three sourcing
     * strategies. Control heights are their own role.
     */
    @Test
    internal fun control_heights_exist_as_their_own_token_category() {
        assertThat(HomeservicesSize.controlSm.value.toInt()).isEqualTo(40)
        assertThat(HomeservicesSize.controlMd.value.toInt()).isEqualTo(48)
        assertThat(HomeservicesSize.controlLg.value.toInt()).isEqualTo(56)
        assertThat(HomeservicesSize.minTouchTarget.value.toInt())
            .`as`("mixed-literacy field users; never below the platform touch minimum")
            .isEqualTo(48)
    }
}

package com.homeservices.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * S-10 / TOK-002 — every Material 3 typography slot must resolve to the bundled font stack.
 *
 * `Typography.kt` previously mapped only 10 of 15 slots and documented the omission as intentional.
 * The consequence was not theoretical: the design system's OWN components used three of the five
 * unmapped slots — `HsSectionCard` (`titleMedium`, 37 call sites), `HsTimelineStep` (`titleSmall`,
 * 10) and `HsInfoRow` (`labelMedium`, 5) — so the shared library shipped mixed typefaces. Across
 * both apps there were 130 unmapped-slot usages (customer 76, technician 54).
 *
 * A precision note carried over from verification, because the original finding stated it wrongly:
 * for LATIN text an unmapped slot renders in Roboto instead of Geist. For DEVANAGARI it does not —
 * Roboto ships no Devanagari glyphs, so Hindi falls through to the *platform* Noto rather than the
 * *bundled* one. Still a defect (uncontrolled, device-variable font source), but a different and
 * milder one than "Hindi renders in Roboto".
 *
 * D1 §Typography: "Every Material 3 typography slot used by shared components must map to
 * HomeservicesFontFamily; no Roboto fallback in production shared components."
 */
internal class D1TypographyCoverageTest {
    private fun allSlots(t: Typography): Map<String, TextStyle> =
        mapOf(
            "displayLarge" to t.displayLarge,
            "displayMedium" to t.displayMedium,
            "displaySmall" to t.displaySmall,
            "headlineLarge" to t.headlineLarge,
            "headlineMedium" to t.headlineMedium,
            "headlineSmall" to t.headlineSmall,
            "titleLarge" to t.titleLarge,
            "titleMedium" to t.titleMedium,
            "titleSmall" to t.titleSmall,
            "bodyLarge" to t.bodyLarge,
            "bodyMedium" to t.bodyMedium,
            "bodySmall" to t.bodySmall,
            "labelLarge" to t.labelLarge,
            "labelMedium" to t.labelMedium,
            "labelSmall" to t.labelSmall,
        )

    @Test
    internal fun every_m3_slot_is_mapped_to_the_bundled_family() {
        val unmapped =
            allSlots(HomeservicesTypography)
                .filterValues { it.fontFamily != HomeservicesFontFamily }
                .keys
                .sorted()

        assertThat(unmapped)
            .`as`(
                "slots falling off the bundled stack (Latin -> Roboto, Devanagari -> platform Noto): %s",
                unmapped,
            )
            .isEmpty()
    }

    @Test
    internal fun no_slot_has_a_zero_or_missing_size() {
        val bad =
            allSlots(HomeservicesTypography)
                .filterValues { it.fontSize.value <= 0f }
                .keys
                .sorted()

        assertThat(bad).`as`("slots with no explicit size inherit M3 defaults: %s", bad).isEmpty()
    }

    @Test
    internal fun every_slot_has_an_explicit_line_height() {
        val bad =
            allSlots(HomeservicesTypography)
                .filterValues { it.lineHeight.value <= 0f }
                .keys
                .sorted()

        assertThat(bad)
            .`as`("Devanagari matras need deliberate line height; unset slots: %s", bad)
            .isEmpty()
    }

    /**
     * D1 §Typography names JetBrains Mono for admin numerics. Android shipped no mono family at all
     * while admin-web had one, so tabular figures were impossible on Android — which is also why
     * money columns could not be aligned. Needed by S-31.
     */
    @Test
    internal fun a_mono_family_exists_for_tabular_numerals() {
        assertThat(HomeservicesMonoFontFamily)
            .`as`("mono family must be a distinct typeface, not an alias of the sans stack")
            .isNotEqualTo(HomeservicesFontFamily)
    }

    /** D1 core ramp — the sizes shared components depend on. */
    @Test
    internal fun core_ramp_matches_the_published_contract() {
        val t = HomeservicesTypography
        assertThat(t.headlineLarge.fontSize.value.toInt()).`as`("title.xl").isEqualTo(28)
        assertThat(t.headlineMedium.fontSize.value.toInt()).`as`("title.lg").isEqualTo(22)
        assertThat(t.titleLarge.fontSize.value.toInt()).`as`("title.md").isEqualTo(18)
        assertThat(t.bodyLarge.fontSize.value.toInt()).`as`("body.lg").isEqualTo(16)
        assertThat(t.bodyMedium.fontSize.value.toInt()).`as`("body.md").isEqualTo(14)
        assertThat(t.bodySmall.fontSize.value.toInt()).`as`("body.sm").isEqualTo(12)
        assertThat(t.labelLarge.fontSize.value.toInt()).`as`("label.lg").isEqualTo(14)
        assertThat(t.labelSmall.fontSize.value.toInt()).`as`("label.sm").isEqualTo(11)
    }

    /**
     * D1 §Typography: customer and technician body text defaults to at least 16sp. `bodyLarge` is
     * that default, so it is the one slot that must never be reduced for density.
     */
    @Test
    internal fun default_body_is_at_least_16sp_for_field_users() {
        assertThat(HomeservicesTypography.bodyLarge.fontSize.value)
            .isGreaterThanOrEqualTo(16f)
    }
}

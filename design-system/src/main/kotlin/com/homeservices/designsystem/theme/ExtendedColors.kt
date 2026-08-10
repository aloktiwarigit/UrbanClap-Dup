@file:Suppress("MatchingDeclarationName")

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// Extended colour tokens — UX §5.1 dossier rows not covered by M3 ColorScheme
//
// Material 3's ColorScheme has a fixed set of semantic slots. Homeservices
// requires several additional tokens (verified-state green, neighbourhood
// accent, brand-accent surface, primary hover) that do not map cleanly to any
// M3 slot without overloading its semantic meaning.
//
// These tokens are therefore exposed as a separate data class and provided via
// a Compose CompositionLocal so that composables deep in the tree can access
// them without threading them manually through parameters.
//
// IMPORTANT: callers MUST wrap content in HomeservicesTheme (implemented in T3)
// to ensure the correct dark-mode variant is provided. Accessing
// LocalHomeservicesExtendedColors.current outside HomeservicesTheme will return
// the light defaults — which is intentional for Preview usage but incorrect for
// dark-mode runtime rendering.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supplemental colour tokens from UX §5.1 that are not representable as
 * standard Material 3 ColorScheme slots.
 *
 * Instances are provided through [LocalHomeservicesExtendedColors]. Use
 * `LocalHomeservicesExtendedColors.current` inside any composable wrapped by
 * `HomeservicesTheme`.
 *
 * @param verified       Colour used to indicate a verified / trusted state
 *                       (maps to Semantic.Success — UX §5.1).
 * @param neighbourhood  Accent colour for neighbourhood / locality UI elements
 *                       (maps to Brand.Accent — UX §5.1).
 * @param brandAccent    Direct Brand.Accent token for surfaces and icon tints
 *                       (UX §5.1 Brand.Accent).
 * @param brandPrimaryHover Interactive hover / pressed state of the primary
 *                       brand colour (UX §5.1 Brand.PrimaryHover).
 */
public data class HomeservicesExtendedColors(
    val verified: Color,
    val neighbourhood: Color,
    val brandAccent: Color,
    val brandPrimaryHover: Color,
    /**
     * Metadata-only text. D1 §Palette "text faint" — 5.24:1 light / 4.71:1 dark. Clears AA but sits
     * below the 7:1 field target, so it is for timestamps, counts and captions only. Never body copy.
     *
     * Added in S-10: D1 defines nine core roles and this was the one with no M3 slot to bind to.
     */
    val textFaint: Color,
    /**
     * Focus / selected-boundary indicator. **Do not substitute a border or the accent for this.**
     *
     * WCAG 2.2 §1.4.11 requires 3:1 for non-text indicators that identify a component. Measured on
     * `surface`, neither candidate qualifies in light mode:
     *
     *   border-strong  #B0A382  2.14:1 light   1.50:1 dark
     *   brand accent   #E2A04A  1.93:1 light   8.03:1 dark
     *
     * Marigold on warm paper is inherently low-contrast — both are light — so the accent works as a
     * focus ring in dark mode and fails in light. D1 §Palette defines no focus role, which is a gap
     * in the contract rather than in this implementation; raised as a finding.
     *
     * This binds to the text roles, which clear the bar in both modes (8.59:1 light on surface).
     * The border tokens remain correct for what they are — decorative hairlines and separators,
     * which §1.4.11 does not govern.
     */
    val focusRing: Color,
    /**
     * Accent hue as a legible foreground. Use for prices, accent labels and accent icon tints.
     * **Do not use `colorScheme.primary` for text** — see [AccentInkLight].
     *
     * Light: `#6F4610` — 7.60:1 on `background` (canvas), 7.04:1 on `surface`, 6.19:1 on
     * `surfaceVariant`. All three clear AA (4.5:1); acceptance 6b's ≥7:1 field target names
     * canvas and surface only, which this clears — `surfaceVariant` usage clears AA but not that
     * stricter target. Dark: the raw accent, already 8.03:1.
     */
    val accentInk: Color,
)

/** Light-mode instance of [HomeservicesExtendedColors]. D1 light palette. */
public val HomeservicesExtendedColorsLight: HomeservicesExtendedColors =
    HomeservicesExtendedColors(
        verified = SemanticSuccessLight,
        neighbourhood = BrandAccent,
        brandAccent = BrandAccent,
        brandPrimaryHover = BrandAccentSoft,
        textFaint = TextFaintLight,
        focusRing = TextMutedLight,
        accentInk = AccentInkLight,
    )

/** Dark-mode instance of [HomeservicesExtendedColors]. D1 dark palette. */
public val HomeservicesExtendedColorsDark: HomeservicesExtendedColors =
    HomeservicesExtendedColors(
        verified = SemanticSuccessDark,
        neighbourhood = BrandAccent,
        brandAccent = BrandAccent,
        brandPrimaryHover = BrandAccentSoft,
        textFaint = TextFaintDark,
        focusRing = TextMutedDark,
        accentInk = BrandAccent,
    )

/**
 * CompositionLocal that provides [HomeservicesExtendedColors] to the composition tree.
 *
 * Default: [HomeservicesExtendedColorsLight] (light variant). This default is used
 * automatically in `@Preview` composables and in any context not wrapped by
 * `HomeservicesTheme`. For correct dark-mode behaviour, always wrap your root
 * composable in `HomeservicesTheme`.
 *
 * Uses [staticCompositionLocalOf] because the colour object is replaced wholesale
 * on theme change — there is no meaningful "partial" update path.
 */
public val LocalHomeservicesExtendedColors: ProvidableCompositionLocal<HomeservicesExtendedColors> =
    staticCompositionLocalOf { HomeservicesExtendedColorsLight }

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
)

/**
 * Light-mode instance of [HomeservicesExtendedColors]. UX §5.1 light palette.
 */
public val HomeservicesExtendedColorsLight: HomeservicesExtendedColors =
    HomeservicesExtendedColors(
        verified = SemanticSuccessLight,
        neighbourhood = BrandAccentLight,
        brandAccent = BrandAccentLight,
        brandPrimaryHover = BrandPrimaryHoverLight,
    )

/**
 * Dark-mode instance of [HomeservicesExtendedColors]. UX §5.1 dark palette.
 */
public val HomeservicesExtendedColorsDark: HomeservicesExtendedColors =
    HomeservicesExtendedColors(
        verified = SemanticSuccessDark,
        neighbourhood = BrandAccentDark,
        brandAccent = BrandAccentDark,
        brandPrimaryHover = BrandPrimaryHoverDark,
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

package com.homeservices.designsystem.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// Raw internal constants — UX §5.1 colour palette
// Not part of the public API; bind to public slots through HomeservicesColors,
// HomeservicesLightColorScheme, and HomeservicesDarkColorScheme.
// ─────────────────────────────────────────────────────────────────────────────

// Brand — light
internal val BrandPrimaryLight = Color(0xFF0B3D2E)
internal val BrandPrimaryDark = Color(0xFF7AC7AA)
internal val BrandPrimaryHoverLight = Color(0xFF062A20)
internal val BrandPrimaryHoverDark = Color(0xFF94D8C0)
internal val BrandAccentLight = Color(0xFFB68A2C)
internal val BrandAccentDark = Color(0xFFD7B760)

// Semantic
internal val SemanticSuccessLight = Color(0xFF10A85E)
internal val SemanticSuccessDark = Color(0xFF25C97B)
internal val SemanticWarningLight = Color(0xFFEBA53A)
internal val SemanticWarningDark = Color(0xFFF5B850)
internal val SemanticDangerLight = Color(0xFFD73C3C)
internal val SemanticDangerDark = Color(0xFFEC5252)
internal val SemanticInfoLight = Color(0xFF2E72D9)
internal val SemanticInfoDark = Color(0xFF4F90EC)

// Neutral
internal val Neutral0Light = Color(0xFFFBF7EF)
internal val Neutral0Dark = Color(0xFF071511)
internal val Neutral50Light = Color(0xFFFFFDF8)
internal val Neutral50Dark = Color(0xFF0D1D18)
internal val Neutral100Light = Color(0xFFE8F1EC)
internal val Neutral100Dark = Color(0xFF172A24)
internal val Neutral200Light = Color(0xFFDED8CD)
internal val Neutral200Dark = Color(0xFF2E423A)
internal val Neutral500Light = Color(0xFF5F6C66)
internal val Neutral500Dark = Color(0xFFB7C6BD)
internal val Neutral900Light = Color(0xFF18231F)
internal val Neutral900Dark = Color(0xFFF4FBF6)

// ─────────────────────────────────────────────────────────────────────────────
// Public grouping object — UX §5.1
//
// Holds the LIGHT-mode variants of brand and semantic tokens as named constants.
// Dark-mode variants live in [HomeservicesDarkColorScheme]; use them through
// the MaterialTheme ColorScheme rather than directly referencing raw constants.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Typed grouping of the UX §5.1 brand and semantic colour tokens (light-mode values).
 *
 * Usage — access via nested objects:
 * ```
 * HomeservicesColors.brand.primary    // #0B3D2E
 * HomeservicesColors.semantic.danger  // #D73C3C
 * ```
 */
public object HomeservicesColors {
    /**
     * Brand palette — UX §5.1 §Brand.
     *
     * These are the LIGHT variants. Corresponding dark values are wired into
     * [HomeservicesDarkColorScheme].
     */
    public object Brand {
        /** Forest primary — light. UX §5.1 Brand.Primary. */
        public val primary: Color = BrandPrimaryLight

        /** Forest primary hover/pressed — light. UX §5.1 Brand.PrimaryHover. */
        public val primaryHover: Color = BrandPrimaryHoverLight

        /** Brass accent — light. UX §5.1 Brand.Accent. */
        public val accent: Color = BrandAccentLight
    }

    /**
     * Semantic palette — UX §5.1 §Semantic.
     *
     * Light variants only; dark counterparts live in [HomeservicesDarkColorScheme].
     */
    public object Semantic {
        /** Success green — light. UX §5.1 Semantic.Success. */
        public val success: Color = SemanticSuccessLight

        /** Warning amber — light. UX §5.1 Semantic.Warning. */
        public val warning: Color = SemanticWarningLight

        /** Danger red — light. UX §5.1 Semantic.Danger. */
        public val danger: Color = SemanticDangerLight

        /** Info blue — light. UX §5.1 Semantic.Info. */
        public val info: Color = SemanticInfoLight
    }

    /** Convenience accessor for [Brand]. */
    public val brand: Brand = Brand

    /** Convenience accessor for [Semantic]. */
    public val semantic: Semantic = Semantic
}

// ─────────────────────────────────────────────────────────────────────────────
// Material 3 ColorScheme instances — UX §5.1 slot mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Material 3 light colour scheme for Homeservices, derived from UX §5.1.
 *
 * Slot mapping summary:
 * - primary / onPrimary          — forest green / white
 * - primaryContainer             — soft forest tint (#E8F1EC)
 * - secondary / onSecondary      — brass accent / dark warm brown
 * - tertiary                     — info blue
 * - error / onError              — danger red / white (≥4.5:1 AA)
 * - background / onBackground    — Neutral-0 / Neutral-900
 * - surface / onSurface          — Neutral-50 / Neutral-900
 * - surfaceVariant / onSurfaceVariant — Neutral-100 / Neutral-500 (large-text per NFR-A-5)
 * - outline / outlineVariant     — Neutral-200 / Neutral-100
 */
public val HomeservicesLightColorScheme: ColorScheme =
    lightColorScheme(
        primary = BrandPrimaryLight,
        onPrimary = Color.White,
        primaryContainer = Color(0xFFE8F1EC),
        onPrimaryContainer = BrandPrimaryLight,
        secondary = BrandAccentLight,
        onSecondary = Color(0xFF1F1606),
        tertiary = SemanticInfoLight,
        error = SemanticDangerLight,
        onError = Color.White,
        background = Neutral0Light,
        onBackground = Neutral900Light,
        surface = Neutral50Light,
        onSurface = Neutral900Light,
        surfaceVariant = Neutral100Light,
        onSurfaceVariant = Neutral500Light,
        outline = Neutral200Light,
        outlineVariant = Neutral100Light,
    )

/**
 * Material 3 dark colour scheme for Homeservices, derived from UX §5.1.
 *
 * Slot mapping summary:
 * - primary / onPrimary          — light forest green / deep green
 * - primaryContainer             — forest green container
 * - secondary / onSecondary      — brass accent / warm dark text
 * - tertiary                     — info blue dark
 * - error / onError              — danger red dark / deeper wine red (≥4.5:1 AA)
 * - background / onBackground    — Neutral-0-dark / Neutral-900-dark
 * - surface / onSurface          — Neutral-50-dark / Neutral-900-dark
 * - surfaceVariant / onSurfaceVariant — Neutral-100-dark / Neutral-500-dark (large-text per NFR-A-5)
 * - outline / outlineVariant     — Neutral-200-dark / Neutral-100-dark
 */
public val HomeservicesDarkColorScheme: ColorScheme =
    darkColorScheme(
        primary = BrandPrimaryDark,
        onPrimary = Color(0xFF061D17),
        primaryContainer = BrandPrimaryLight,
        onPrimaryContainer = Color(0xFFE8F1EC),
        secondary = BrandAccentDark,
        onSecondary = Color(0xFF20190A),
        tertiary = SemanticInfoDark,
        error = SemanticDangerDark,
        onError = Color(0xFF3A0A0A),
        background = Neutral0Dark,
        onBackground = Neutral900Dark,
        surface = Neutral50Dark,
        onSurface = Neutral900Dark,
        surfaceVariant = Neutral100Dark,
        onSurfaceVariant = Neutral500Dark,
        outline = Neutral200Dark,
        outlineVariant = Neutral100Dark,
    )

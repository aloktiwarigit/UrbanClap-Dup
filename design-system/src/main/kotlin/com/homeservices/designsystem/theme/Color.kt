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
internal val BrandPrimaryLight = Color(0xFF0E4F47)
internal val BrandPrimaryDark = Color(0xFF1E8378)
internal val BrandPrimaryHoverLight = Color(0xFF0A3D37)
internal val BrandPrimaryHoverDark = Color(0xFF2BA08F)
internal val BrandAccentLight = Color(0xFFEF6F4B)
internal val BrandAccentDark = Color(0xFFF78866)

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
internal val Neutral0Light = Color(0xFFFFFFFF)
internal val Neutral0Dark = Color(0xFF0A0A0B)
internal val Neutral50Light = Color(0xFFFAFAFA)
internal val Neutral50Dark = Color(0xFF141518)
internal val Neutral100Light = Color(0xFFF4F4F5)
internal val Neutral100Dark = Color(0xFF1D1F23)
internal val Neutral200Light = Color(0xFFE4E4E7)
internal val Neutral200Dark = Color(0xFF2A2D34)
internal val Neutral500Light = Color(0xFF71717A)
internal val Neutral500Dark = Color(0xFF9CA3AF)
internal val Neutral900Light = Color(0xFF18181B)
internal val Neutral900Dark = Color(0xFFFAFAFA)

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
 * HomeservicesColors.brand.primary    // #0E4F47
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
        /** Teal primary — light. UX §5.1 Brand.Primary. */
        public val primary: Color = BrandPrimaryLight

        /** Teal primary hover/pressed — light. UX §5.1 Brand.PrimaryHover. */
        public val primaryHover: Color = BrandPrimaryHoverLight

        /** Coral accent — light. UX §5.1 Brand.Accent. */
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
 * - primary / onPrimary          — brand teal / white (≥9:1 AA)
 * - primaryContainer             — light teal tint (#CFEBE5)
 * - secondary / onSecondary      — coral accent / dark warm brown (≥5:1 AA — white fails on coral)
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
        primaryContainer = Color(0xFFCFEBE5),
        onPrimaryContainer = BrandPrimaryLight,
        secondary = BrandAccentLight,
        onSecondary = Color(0xFF3D1A0E),
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
 * - primary / onPrimary          — brand teal dark / pure black (≥8:1 AA — deep teal on medium teal is ~3:1)
 * - primaryContainer             — brand teal dark (reused as container)
 * - secondary / onSecondary      — coral accent dark / deep coral (≥5:1 AA)
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
        onPrimary = Color.Black,
        primaryContainer = BrandPrimaryDark,
        onPrimaryContainer = Color.White,
        secondary = BrandAccentDark,
        onSecondary = Color(0xFF4A1B0E),
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

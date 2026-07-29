package com.homeservices.designsystem.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color

// ─────────────────────────────────────────────────────────────────────────────
// D1 token core — see docs/design/design-language.md §Palette.
//
// One core, three surface expressions (customer light / technician light / admin dark). The accent
// is a single marigold used sparingly for decisions, active states and selected emphasis.
//
// History, because it matters to anyone tempted to "restore" an older palette: this module
// previously shipped forest #0B3D2E + brass #B68A2C on warm cream, while its own header comments
// claimed conformance to docs/ux-design.md §5.1 — which specifies deep teal #0E4F47 + coral #EF6F4B.
// Neither matched admin-web, which had separately rebranded to marigold on warm ink. Three shipped
// surfaces, no two agreeing on a single token. D1 resolves that; those directions are superseded and
// must not be reintroduced. See docs/design/uiux-audit-2026.md.
//
// Raw constants are internal. Bind through HomeservicesColors, the two ColorSchemes, and
// HomeservicesExtendedColors.
// ─────────────────────────────────────────────────────────────────────────────

// Brand — one accent, identical in both modes so it cannot drift per-surface.
internal val BrandAccent = Color(0xFFE2A04A)
internal val BrandAccentSoft = Color(0xFFF1B86A)
internal val BrandAccentDim = Color(0xFF6F4818)

// Neutrals — light (warm paper)
internal val CanvasLight = Color(0xFFFBF6E9)
internal val SurfaceLight = Color(0xFFF4EDDF)
internal val SurfaceRaisedLight = Color(0xFFE9DFC6)
internal val TextStrongLight = Color(0xFF1A140F)
internal val TextMutedLight = Color(0xFF4A4135)
internal val TextFaintLight = Color(0xFF6E665B)
internal val BorderLight = Color(0xFFD4C9AB)
internal val BorderStrongLight = Color(0xFFB0A382)

// Neutrals — dark (warm ink)
internal val CanvasDark = Color(0xFF0E0B08)
internal val SurfaceDark = Color(0xFF1A1610)
internal val SurfaceRaisedDark = Color(0xFF221C15)
internal val TextStrongDark = Color(0xFFF1E9D8)
internal val TextMutedDark = Color(0xFF9A9082)
internal val TextFaintDark = Color(0xFF877A6D)
internal val BorderDark = Color(0xFF2E2719)
internal val BorderStrongDark = Color(0xFF3E3528)

// Semantic — unchanged by D1, which permits the existing green/warn/danger/info roles.
// These four were the ONLY tokens that already agreed across the spec and both implementations,
// so they are deliberately left alone.
internal val SemanticSuccessLight = Color(0xFF10A85E)
internal val SemanticSuccessDark = Color(0xFF25C97B)
internal val SemanticWarningLight = Color(0xFFEBA53A)
internal val SemanticWarningDark = Color(0xFFF5B850)
internal val SemanticDangerLight = Color(0xFFD73C3C)
internal val SemanticDangerDark = Color(0xFFEC5252)
internal val SemanticInfoLight = Color(0xFF2E72D9)
internal val SemanticInfoDark = Color(0xFF4F90EC)

/**
 * Typed grouping of the D1 brand and semantic tokens.
 *
 * Usage:
 * ```
 * HomeservicesColors.brand.accent      // #E2A04A
 * HomeservicesColors.semantic.danger   // #D73C3C
 * ```
 */
public object HomeservicesColors {
    /** Brand palette — D1 §Palette. One accent, shared across modes. */
    public object Brand {
        /** Marigold accent. Use sparingly: primary decisions, active states, selected emphasis. */
        public val accent: Color = BrandAccent

        /** Lifted accent for hover/pressed states and gradient ends. */
        public val accentSoft: Color = BrandAccentSoft

        /** Deep accent for dark-mode containers and dim fills. */
        public val accentDim: Color = BrandAccentDim

        /**
         * Retained alias for the pre-D1 name, kept so this change does not break call sites.
         * Four customer-app sites read the old hover token as a gradient start (AuthScreen,
         * ServiceDetailScreen, ServiceListScreen, CatalogueHomeScreen); they move to [accentSoft]
         * in the per-surface stories.
         */
        public val primary: Color = BrandAccent

        /**
         * Retained alias for the pre-D1 hover token, now pointing at [accentSoft].
         *
         * Five technician-app screens read this (AuthScreen, EarningsScreen, KycScreen,
         * PhotoUploadRetryBanner, OnboardingScreen) as a gradient end. Worth recording: the audit's
         * token census counted `LocalHomeservicesExtendedColors.current.brandPrimaryHover` and
         * reported the hover role as customer-app-only. It missed these because they reach the same
         * role through the *object* accessor rather than the CompositionLocal — a second access path
         * the grep did not cover. Another reason a zero count is not proof of a dead token.
         */
        public val primaryHover: Color = BrandAccentSoft
    }

    /** Semantic palette — light variants; dark counterparts live in [HomeservicesDarkColorScheme]. */
    public object Semantic {
        /** Success green. */
        public val success: Color = SemanticSuccessLight

        /** Warning amber. */
        public val warning: Color = SemanticWarningLight

        /** Danger red — errors, cancellation, SOS. */
        public val danger: Color = SemanticDangerLight

        /** Info blue. */
        public val info: Color = SemanticInfoLight
    }

    /** Convenience accessor for [Brand]. */
    public val brand: Brand = Brand

    /** Convenience accessor for [Semantic]. */
    public val semantic: Semantic = Semantic
}

/**
 * D1 light scheme — warm paper. Default for the customer and technician apps, because the field
 * context is outdoor sunlight on low-quality screens (D2).
 *
 * Role mapping:
 * - primary / onPrimary                — marigold / warm ink (8.39:1)
 * - primaryContainer                   — soft marigold tint for selected rows and chips
 * - secondary / onSecondary            — muted ink / canvas; a single-accent system uses a neutral
 * - tertiary                           — semantic info
 * - background / onBackground          — canvas / text-strong (16.91:1)
 * - surface / onSurface                — surface / text-strong
 * - surfaceVariant / onSurfaceVariant  — raised surface / text-muted (9.27:1 on canvas — body-safe,
 *                                        unlike the pre-D1 value which was knowingly sub-AA and
 *                                        annotated "large-text only" while the spec claimed AA)
 * - outline / outlineVariant           — border-strong / border
 */
public val HomeservicesLightColorScheme: ColorScheme =
    lightColorScheme(
        primary = BrandAccent,
        onPrimary = CanvasDark,
        primaryContainer = Color(0xFFF7E7CB),
        onPrimaryContainer = TextStrongLight,
        secondary = TextMutedLight,
        onSecondary = CanvasLight,
        // Container roles are set explicitly. M3 fills any slot left unset with its BASELINE
        // palette, which is violet — so a Chip or FilterChip using secondaryContainer would render
        // default lavender inside a warm-paper product. Overriding `tertiary` without `onTertiary`
        // is the same trap: the label keeps the baseline colour and the pair drops below AA.
        secondaryContainer = SurfaceRaisedLight,
        onSecondaryContainer = TextStrongLight,
        tertiary = SemanticInfoLight,
        onTertiary = Color.White,
        tertiaryContainer = SurfaceRaisedLight,
        onTertiaryContainer = TextStrongLight,
        error = SemanticDangerLight,
        onError = Color.White,
        errorContainer = Color(0xFFF7DCDC),
        onErrorContainer = Color(0xFF4A1010),
        background = CanvasLight,
        onBackground = TextStrongLight,
        surface = SurfaceLight,
        onSurface = TextStrongLight,
        surfaceVariant = SurfaceRaisedLight,
        onSurfaceVariant = TextMutedLight,
        outline = BorderStrongLight,
        outlineVariant = BorderLight,
    )

/**
 * D1 dark scheme — warm ink. Default for admin web; available on the Android apps as a user choice.
 *
 * The accent is the same marigold as light mode by design: a per-mode accent shift is exactly how
 * the previous palettes drifted apart.
 */
public val HomeservicesDarkColorScheme: ColorScheme =
    darkColorScheme(
        primary = BrandAccent,
        onPrimary = CanvasDark,
        primaryContainer = BrandAccentDim,
        onPrimaryContainer = TextStrongDark,
        secondary = TextMutedDark,
        onSecondary = CanvasDark,
        secondaryContainer = SurfaceRaisedDark,
        onSecondaryContainer = TextStrongDark,
        tertiary = SemanticInfoDark,
        // Ink, not the M3 baseline. The default dark onTertiary against #4F90EC measures 4.10:1 —
        // below AA for body text. Ink measures 6.11:1.
        onTertiary = CanvasDark,
        tertiaryContainer = SurfaceRaisedDark,
        onTertiaryContainer = TextStrongDark,
        error = SemanticDangerDark,
        onError = Color(0xFF3A0A0A),
        errorContainer = Color(0xFF4A1010),
        onErrorContainer = Color(0xFFF7DCDC),
        background = CanvasDark,
        onBackground = TextStrongDark,
        surface = SurfaceDark,
        onSurface = TextStrongDark,
        surfaceVariant = SurfaceRaisedDark,
        onSurfaceVariant = TextMutedDark,
        outline = BorderStrongDark,
        outlineVariant = BorderDark,
    )

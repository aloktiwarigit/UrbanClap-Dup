@file:Suppress("MatchingDeclarationName")

package com.homeservices.designsystem.theme

import androidx.compose.material3.ColorScheme

/**
 * Pure dark-mode-selection helpers extracted from [HomeservicesTheme] so the
 * `if (darkTheme)` branches are unit-testable under Kover.
 *
 * Rationale: @Composable function bodies run under Paparazzi's layoutlib
 * classloader, which Kover does not instrument (plan B10). `HomeservicesTheme`
 * itself is therefore excluded from Kover; the selection logic lives here so
 * plain JUnit can cover it.
 */
internal fun selectColorScheme(darkTheme: Boolean): ColorScheme =
    if (darkTheme) HomeservicesDarkColorScheme else HomeservicesLightColorScheme

internal fun selectExtendedColors(darkTheme: Boolean): HomeservicesExtendedColors =
    if (darkTheme) HomeservicesExtendedColorsDark else HomeservicesExtendedColorsLight

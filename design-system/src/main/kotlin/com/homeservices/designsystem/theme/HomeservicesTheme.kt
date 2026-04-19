package com.homeservices.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

/**
 * Canonical Compose theme wrapper for the homeservices-mvp Android apps.
 *
 * Installs:
 * - Material 3 [androidx.compose.material3.ColorScheme] (light or dark per [darkTheme])
 * - Material 3 [androidx.compose.material3.Typography] — [HomeservicesTypography]
 * - Material 3 [Shapes] mapped deterministically from UX §5.7 radii (B1 fix):
 *     extraSmall → HomeservicesRadius.sm  (4dp — chips, tags)
 *     small      → HomeservicesRadius.md  (8dp — buttons, inputs)
 *     medium     → HomeservicesRadius.lg  (12dp — cards, bottom sheets)
 *     large      → HomeservicesRadius.xl  (20dp — large containers, hero photos)
 *     extraLarge → HomeservicesRadius.full (9999dp — pills, circular avatars, FABs)
 * - Five Homeservices [CompositionLocalProvider] entries:
 *     [LocalHomeservicesSpacing], [LocalHomeservicesRadius], [LocalHomeservicesElevation],
 *     [LocalHomeservicesMotion], [LocalHomeservicesExtendedColors] (light or dark per [darkTheme]).
 *
 * Consumers wrap screen content once at the top of each Activity or Composable tree:
 * ```
 * HomeservicesTheme { MyScreen() }
 * ```
 *
 * Dark-mode is system-driven by default via [isSystemInDarkTheme]. A future user-preference
 * override (DataStore-backed) will land as a separate wrapper — no API change to this function.
 */
@Composable
public fun HomeservicesTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) HomeservicesDarkColorScheme else HomeservicesLightColorScheme
    val extendedColors = if (darkTheme) HomeservicesExtendedColorsDark else HomeservicesExtendedColorsLight

    CompositionLocalProvider(
        LocalHomeservicesSpacing provides HomeservicesSpacing,
        LocalHomeservicesRadius provides HomeservicesRadius,
        LocalHomeservicesElevation provides HomeservicesElevation,
        LocalHomeservicesMotion provides HomeservicesMotion,
        LocalHomeservicesExtendedColors provides extendedColors,
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = HomeservicesTypography,
            shapes =
                Shapes(
                    extraSmall = RoundedCornerShape(HomeservicesRadius.sm),
                    small = RoundedCornerShape(HomeservicesRadius.md),
                    medium = RoundedCornerShape(HomeservicesRadius.lg),
                    large = RoundedCornerShape(HomeservicesRadius.xl),
                    extraLarge = RoundedCornerShape(HomeservicesRadius.full),
                ),
            content = content,
        )
    }
}

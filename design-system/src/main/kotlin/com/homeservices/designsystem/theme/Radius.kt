/**
 * UX §5.7 corner-radius tokens.
 *
 * Dual-exposure pattern:
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesRadius.current.<token>` over
 * direct `HomeservicesRadius.<token>` so a future themed-override (e.g. dense-mode variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 */
@file:Suppress("MatchingDeclarationName") // object + val = 2 top-level decls; detekt counts only class-like nodes

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** UX §5.7 corner-radius scale. */
public object HomeservicesRadius {
    /** 4 dp — small radius (chips, tags). */
    public val sm: Dp = 4.dp

    /** 8 dp — medium radius (cards, inputs). */
    public val md: Dp = 8.dp

    /** 12 dp — large radius (bottom sheets, modals). */
    public val lg: Dp = 12.dp

    /** 20 dp — extra-large radius (FABs, pill buttons). */
    public val xl: Dp = 20.dp

    /** 9999 dp — fully circular / pill shape. */
    public val full: Dp = 9999.dp
}

/**
 * UX §5.7 — CompositionLocal carrier for [HomeservicesRadius].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * shape-override themes. Defaults to the singleton [HomeservicesRadius] object.
 */
public val LocalHomeservicesRadius: ProvidableCompositionLocal<HomeservicesRadius> =
    staticCompositionLocalOf { HomeservicesRadius }

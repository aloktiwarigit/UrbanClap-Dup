/**
 * UX §5.3 spacing tokens — 4pt grid.
 *
 * Dual-exposure pattern:
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesSpacing.current.<token>` over
 * direct `HomeservicesSpacing.<token>` so a future themed-override (e.g. dense-mode variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 */
@file:Suppress("MatchingDeclarationName") // object + val = 2 top-level decls; detekt counts only class-like nodes

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** UX §5.3 spacing — 4pt grid. */
public object HomeservicesSpacing {
    /** 0 dp — no spacing. */
    public val space0: Dp = 0.dp

    /** 4 dp — 1 grid unit. */
    public val space1: Dp = 4.dp

    /** 8 dp — 2 grid units. */
    public val space2: Dp = 8.dp

    /** 12 dp — 3 grid units. */
    public val space3: Dp = 12.dp

    /** 16 dp — 4 grid units. */
    public val space4: Dp = 16.dp

    /** 24 dp — 6 grid units. */
    public val space6: Dp = 24.dp

    /** 32 dp — 8 grid units. */
    public val space8: Dp = 32.dp

    /** 48 dp — 12 grid units. */
    public val space12: Dp = 48.dp

    /** 64 dp — 16 grid units. */
    public val space16: Dp = 64.dp

    /** 96 dp — 24 grid units. */
    public val space24: Dp = 96.dp
}

/**
 * UX §5.3 — CompositionLocal carrier for [HomeservicesSpacing].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * density variants (e.g. dense-mode). Defaults to the singleton [HomeservicesSpacing] object.
 */
public val LocalHomeservicesSpacing: ProvidableCompositionLocal<HomeservicesSpacing> =
    staticCompositionLocalOf { HomeservicesSpacing }

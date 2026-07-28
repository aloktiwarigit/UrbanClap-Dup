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

/** A surface-specific corner-radius scale. */
public data class HomeservicesRadiusScale(
    val sm: Dp,
    val md: Dp,
    val lg: Dp,
    val xl: Dp,
    val full: Dp = 9999.dp,
)

/** D1 customer corner-radius scale: 8 / 12 / 20. */
public val HomeservicesCustomerRadius: HomeservicesRadiusScale =
    HomeservicesRadiusScale(
        sm = 8.dp,
        md = 12.dp,
        lg = 20.dp,
        xl = 20.dp,
    )

/** D1 technician corner-radius scale: 4 / 8 / 12. */
public val HomeservicesTechnicianRadius: HomeservicesRadiusScale =
    HomeservicesRadiusScale(
        sm = 4.dp,
        md = 8.dp,
        lg = 12.dp,
        xl = 12.dp,
    )

/**
 * Back-compatible customer/default radius object.
 *
 * Do not delete this. Existing call sites use `HomeservicesRadius.sm` directly, and MaterialTheme
 * shape mapping still reaches this contract through [LocalHomeservicesRadius].
 */
public object HomeservicesRadius {
    /** 8 dp — customer small radius. */
    public val sm: Dp = HomeservicesCustomerRadius.sm

    /** 12 dp — customer medium radius. */
    public val md: Dp = HomeservicesCustomerRadius.md

    /** 20 dp — customer large radius. */
    public val lg: Dp = HomeservicesCustomerRadius.lg

    /** 20 dp — customer extra-large radius. */
    public val xl: Dp = HomeservicesCustomerRadius.xl

    /** 9999 dp — fully circular / pill shape. */
    public val full: Dp = HomeservicesCustomerRadius.full
}

/**
 * UX §5.7 — CompositionLocal carrier for [HomeservicesRadius].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * shape-override themes. Defaults to the singleton [HomeservicesRadius] object.
 */
public val LocalHomeservicesRadius: ProvidableCompositionLocal<HomeservicesRadiusScale> =
    staticCompositionLocalOf { HomeservicesCustomerRadius }

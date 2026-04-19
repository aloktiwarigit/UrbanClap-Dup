/**
 * UX §5.5 elevation tokens — Dp values and shadow descriptors (light + dark).
 *
 * Dual-exposure pattern:
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesElevation.current.<token>` over
 * direct `HomeservicesElevation.<token>` so a future themed-override (e.g. dense-mode variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 */
package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** UX §5.5 elevation Dp scale. */
public object HomeservicesElevation {
    /** 0 dp — flat / no elevation. */
    public val elev0: Dp = 0.dp

    /** 1 dp — subtle lift (app bars, nav bars). */
    public val elev1: Dp = 1.dp

    /** 4 dp — raised surface (cards). */
    public val elev2: Dp = 4.dp

    /** 8 dp — floating surface (bottom sheets). */
    public val elev3: Dp = 8.dp

    /** 16 dp — overlay (modals, dialogs). */
    public val elev4: Dp = 16.dp
}

/**
 * UX §5.5 shadow descriptor.
 *
 * Carries the four CSS-equivalent shadow parameters so consumers can apply them via
 * `Modifier.shadow` or a custom `DrawScope` extension without re-specifying values inline.
 */
public data class HomeservicesShadow(
    /** Horizontal shadow offset. */
    val offsetX: Dp,
    /** Vertical shadow offset. */
    val offsetY: Dp,
    /** Shadow blur radius. */
    val blur: Dp,
    /** Shadow colour (pre-multiplied alpha included in the Color value). */
    val color: Color,
)

/**
 * UX §5.5 light-mode shadow descriptors.
 * Alpha channel values: elev1/2 → 0x14 (8 %), elev3 → 0x1F (12 %), elev4 → 0x29 (16 %).
 */
public object HomeservicesElevationShadowsLight {
    /** No shadow — flat surface. */
    public val elev0: HomeservicesShadow = HomeservicesShadow(0.dp, 0.dp, 0.dp, Color.Transparent)

    /** 0 1dp 2dp rgba(0,0,0,0.08). */
    public val elev1: HomeservicesShadow = HomeservicesShadow(0.dp, 1.dp, 2.dp, Color(0x14000000))

    /** 0 4dp 12dp rgba(0,0,0,0.08). */
    public val elev2: HomeservicesShadow = HomeservicesShadow(0.dp, 4.dp, 12.dp, Color(0x14000000))

    /** 0 8dp 24dp rgba(0,0,0,0.12). */
    public val elev3: HomeservicesShadow = HomeservicesShadow(0.dp, 8.dp, 24.dp, Color(0x1F000000))

    /** 0 16dp 48dp rgba(0,0,0,0.16). */
    public val elev4: HomeservicesShadow = HomeservicesShadow(0.dp, 16.dp, 48.dp, Color(0x29000000))
}

/**
 * UX §5.5 dark-mode shadow descriptors.
 * Alpha channel values: elev1 → 0x66 (40 %), elev2 → 0x80 (50 %),
 * elev3 → 0x99 (60 %), elev4 → 0xB3 (70 %).
 */
public object HomeservicesElevationShadowsDark {
    /** No shadow — flat surface. */
    public val elev0: HomeservicesShadow = HomeservicesShadow(0.dp, 0.dp, 0.dp, Color.Transparent)

    /** 0 1dp 2dp rgba(0,0,0,0.40). */
    public val elev1: HomeservicesShadow = HomeservicesShadow(0.dp, 1.dp, 2.dp, Color(0x66000000))

    /** 0 4dp 12dp rgba(0,0,0,0.50). */
    public val elev2: HomeservicesShadow = HomeservicesShadow(0.dp, 4.dp, 12.dp, Color(0x80000000))

    /** 0 8dp 24dp rgba(0,0,0,0.60). */
    public val elev3: HomeservicesShadow = HomeservicesShadow(0.dp, 8.dp, 24.dp, Color(0x99000000))

    /** 0 16dp 48dp rgba(0,0,0,0.70). */
    public val elev4: HomeservicesShadow = HomeservicesShadow(0.dp, 16.dp, 48.dp, Color(0xB3000000))
}

/**
 * UX §5.5 — CompositionLocal carrier for [HomeservicesElevation].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * elevation-override themes. Defaults to the singleton [HomeservicesElevation] object.
 */
public val LocalHomeservicesElevation: ProvidableCompositionLocal<HomeservicesElevation> =
    staticCompositionLocalOf { HomeservicesElevation }

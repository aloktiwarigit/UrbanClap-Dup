/**
 * D1 elevation tokens — Dp scale. Shadow descriptors were removed in S-10 (no consumers).
 *
 * Dual-exposure pattern:
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesElevation.current.<token>` over
 * direct `HomeservicesElevation.<token>` so a future themed-override (e.g. dense-mode variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 */
@file:Suppress("MatchingDeclarationName") // object + CompositionLocal val = 2 top-level decls

package com.homeservices.designsystem.theme

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
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

// The UX §5.5 shadow descriptors (HomeservicesShadow, HomeservicesElevationShadowsLight/Dark)
// were removed in S-10. All 11 references repo-wide were their own declarations plus their unit
// test — zero consumers in either app — and the docblock described an intended Modifier.shadow
// consumption that never happened. D1 specifies no shadow-descriptor system; elevation is expressed
// as Dp via HomeservicesElevation, which IS alive (37 HsSectionCard call sites).
// See docs/design/uiux-audit-2026.md TOK-001.

/**
 * UX §5.5 — CompositionLocal carrier for [HomeservicesElevation].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * elevation-override themes. Defaults to the singleton [HomeservicesElevation] object.
 */
public val LocalHomeservicesElevation: ProvidableCompositionLocal<HomeservicesElevation> =
    staticCompositionLocalOf { HomeservicesElevation }

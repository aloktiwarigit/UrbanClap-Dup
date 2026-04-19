/**
 * UX §5.4 motion tokens — durations and cubic-bezier easing curves.
 *
 * Dual-exposure pattern:
 * Consumers in @Composable code SHOULD prefer `LocalHomeservicesMotion.current.<token>` over
 * direct `HomeservicesMotion.<token>` so a future themed-override (e.g. reduced-motion variant)
 * lands in one place. Outside @Composable code (tests, non-Compose Kotlin), use the object
 * directly.
 *
 * Spring curves (damping 0.8/0.4 and 0.7/0.35) mentioned in UX §5.4 are generic over the
 * animated value type and must be constructed by consumer code via
 * `spring(dampingRatio = ..., stiffness = ...)`. They are intentionally absent here.
 */
package com.homeservices.designsystem.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.staticCompositionLocalOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds

/** UX §5.4 animation duration scale. */
public object HomeservicesMotion {
    /** 150 ms — micro-interactions (icon state changes, focus rings). */
    public val fast: Duration = 150.milliseconds

    /** 200 ms — standard transitions (button press, toggle). */
    public val base: Duration = 200.milliseconds

    /** 300 ms — content transitions (page enter/exit, card expand). */
    public val medium: Duration = 300.milliseconds

    /** 500 ms — elaborate transitions (onboarding, full-screen hero). */
    public val slow: Duration = 500.milliseconds
}

/** UX §5.4 pre-materialisable cubic-bezier easing curves. */
public object HomeservicesEasing {
    /**
     * Standard easing — cubic-bezier(0.4, 0, 0.2, 1).
     * Use for elements that enter and exit the same container (e.g. tab switches).
     */
    public val standard: Easing = CubicBezierEasing(0.4f, 0f, 0.2f, 1f)

    /**
     * Emphasized decelerate — cubic-bezier(0.22, 1, 0.36, 1).
     * Use for elements entering the screen from off-screen (e.g. bottom sheet open).
     */
    public val emphasizedDecelerate: Easing = CubicBezierEasing(0.22f, 1f, 0.36f, 1f)
}

/**
 * UX §5.4 — CompositionLocal carrier for [HomeservicesMotion].
 *
 * Provide a custom value via [androidx.compose.runtime.CompositionLocalProvider] to support
 * reduced-motion accessibility preferences. Defaults to the singleton [HomeservicesMotion] object.
 */
public val LocalHomeservicesMotion: ProvidableCompositionLocal<HomeservicesMotion> =
    staticCompositionLocalOf { HomeservicesMotion }

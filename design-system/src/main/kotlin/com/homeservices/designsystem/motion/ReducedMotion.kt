package com.homeservices.designsystem.motion

import android.provider.Settings
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * True when the platform animation scale disables animation.
 *
 * D1 §Motion: "Honor reduced-motion on web and Android." Compose has no first-class API for this,
 * so the platform signal is `Settings.Global.ANIMATOR_DURATION_SCALE`. Pure so it is unit-testable
 * without a Context.
 *
 * Fails safe: a non-positive scale (including a malformed negative) is treated as reduced.
 */
public fun isReducedMotion(animatorDurationScale: Float): Boolean = animatorDurationScale <= 0f

/** Reads [isReducedMotion] from the current platform settings. */
@Composable
public fun rememberReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    return remember(resolver) {
        isReducedMotion(
            Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f),
        )
    }
}

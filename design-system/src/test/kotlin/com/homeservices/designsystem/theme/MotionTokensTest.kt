package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import kotlin.time.Duration.Companion.milliseconds

/**
 * Asserts every UX §5.4 motion-duration and easing token.
 *
 * Each test covers exactly one token so failures pinpoint the offending value.
 * CompositionLocal resolution in @Composable code is covered by Paparazzi in T6.
 * Spring curves (0.8/0.4 and 0.7/0.35) are generic and must be constructed by
 * consumer code; they are intentionally absent from HomeservicesEasing.
 */
internal class MotionTokensTest {
    // ── Duration tokens ───────────────────────────────────────────────────────

    @Test
    internal fun fast_is150ms() {
        assertThat(HomeservicesMotion.fast).isEqualTo(150.milliseconds)
    }

    @Test
    internal fun base_is200ms() {
        assertThat(HomeservicesMotion.base).isEqualTo(200.milliseconds)
    }

    @Test
    internal fun medium_is300ms() {
        assertThat(HomeservicesMotion.medium).isEqualTo(300.milliseconds)
    }

    @Test
    internal fun slow_is500ms() {
        assertThat(HomeservicesMotion.slow).isEqualTo(500.milliseconds)
    }

    // ── Easing tokens ─────────────────────────────────────────────────────────

    @Test
    internal fun standardEasing_isNonNull() {
        assertThat(HomeservicesEasing.standard).isNotNull()
    }

    @Test
    internal fun emphasizedDecelerateEasing_isNonNull() {
        assertThat(HomeservicesEasing.emphasizedDecelerate).isNotNull()
    }

    // ── CompositionLocal default ──────────────────────────────────────────────

    @Test
    internal fun localHomeservicesMotion_isNotNull() {
        // .current requires @Composable context — full CompositionLocal resolution
        // is verified end-to-end in T6 Paparazzi tests. Here we assert the val exists.
        assertThat(LocalHomeservicesMotion).isNotNull()
    }
}

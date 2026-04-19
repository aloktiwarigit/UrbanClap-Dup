package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts every UX §5.7 corner-radius token value.
 *
 * Each test covers exactly one token so failures pinpoint the offending value.
 * CompositionLocal resolution in @Composable code is covered by Paparazzi in T6.
 */
internal class RadiusTokensTest {
    @Test
    internal fun sm_is4dp() {
        assertThat(HomeservicesRadius.sm.value).isEqualTo(4f)
    }

    @Test
    internal fun md_is8dp() {
        assertThat(HomeservicesRadius.md.value).isEqualTo(8f)
    }

    @Test
    internal fun lg_is12dp() {
        assertThat(HomeservicesRadius.lg.value).isEqualTo(12f)
    }

    @Test
    internal fun xl_is20dp() {
        assertThat(HomeservicesRadius.xl.value).isEqualTo(20f)
    }

    @Test
    internal fun full_is9999dp() {
        assertThat(HomeservicesRadius.full.value).isEqualTo(9999f)
    }

    @Test
    internal fun localHomeservicesRadius_isNotNull() {
        // .current requires @Composable context — full CompositionLocal resolution
        // is verified end-to-end in T6 Paparazzi tests. Here we assert the val exists.
        assertThat(LocalHomeservicesRadius).isNotNull()
    }
}

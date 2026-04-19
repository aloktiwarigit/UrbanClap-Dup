package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts every UX §5.3 spacing token value (4pt grid).
 *
 * Each test covers exactly one token so failures pinpoint the offending value.
 * CompositionLocal resolution in @Composable code is covered by Paparazzi in T6.
 */
internal class SpacingTokensTest {
    @Test
    internal fun space0_is0dp() {
        assertThat(HomeservicesSpacing.space0.value).isEqualTo(0f)
    }

    @Test
    internal fun space1_is4dp() {
        assertThat(HomeservicesSpacing.space1.value).isEqualTo(4f)
    }

    @Test
    internal fun space2_is8dp() {
        assertThat(HomeservicesSpacing.space2.value).isEqualTo(8f)
    }

    @Test
    internal fun space3_is12dp() {
        assertThat(HomeservicesSpacing.space3.value).isEqualTo(12f)
    }

    @Test
    internal fun space4_is16dp() {
        assertThat(HomeservicesSpacing.space4.value).isEqualTo(16f)
    }

    @Test
    internal fun space6_is24dp() {
        assertThat(HomeservicesSpacing.space6.value).isEqualTo(24f)
    }

    @Test
    internal fun space8_is32dp() {
        assertThat(HomeservicesSpacing.space8.value).isEqualTo(32f)
    }

    @Test
    internal fun space12_is48dp() {
        assertThat(HomeservicesSpacing.space12.value).isEqualTo(48f)
    }

    @Test
    internal fun space16_is64dp() {
        assertThat(HomeservicesSpacing.space16.value).isEqualTo(64f)
    }

    @Test
    internal fun space24_is96dp() {
        assertThat(HomeservicesSpacing.space24.value).isEqualTo(96f)
    }

    @Test
    internal fun localHomeservicesSpacing_isNotNull() {
        // .current requires @Composable context — full CompositionLocal resolution
        // is verified end-to-end in T6 Paparazzi tests. Here we assert the val exists.
        assertThat(LocalHomeservicesSpacing).isNotNull()
    }
}

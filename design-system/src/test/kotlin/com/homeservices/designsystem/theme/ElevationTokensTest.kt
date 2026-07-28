package com.homeservices.designsystem.theme

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * Asserts every UX §5.5 elevation Dp value and shadow descriptor (light + dark).
 *
 * Each test covers exactly one token row so failures pinpoint the offending value.
 * CompositionLocal resolution in @Composable code is covered by Paparazzi in T6.
 */
internal class ElevationTokensTest {
    // ── Dp tokens ────────────────────────────────────────────────────────────────

    @Test
    internal fun elev0_is0dp() {
        assertThat(HomeservicesElevation.elev0.value).isEqualTo(0f)
    }

    @Test
    internal fun elev1_is1dp() {
        assertThat(HomeservicesElevation.elev1.value).isEqualTo(1f)
    }

    @Test
    internal fun elev2_is4dp() {
        assertThat(HomeservicesElevation.elev2.value).isEqualTo(4f)
    }

    @Test
    internal fun elev3_is8dp() {
        assertThat(HomeservicesElevation.elev3.value).isEqualTo(8f)
    }

    @Test
    internal fun elev4_is16dp() {
        assertThat(HomeservicesElevation.elev4.value).isEqualTo(16f)
    }

    // Shadow-descriptor tests removed in S-10 along with the descriptors themselves — they had
    // zero consumers in either app. Elevation as Dp remains and is exercised above.
}

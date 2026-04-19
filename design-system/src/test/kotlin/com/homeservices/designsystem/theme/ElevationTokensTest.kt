package com.homeservices.designsystem.theme

import androidx.compose.ui.graphics.Color
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

    // ── Light shadows ─────────────────────────────────────────────────────────

    @Test
    internal fun lightElev0Shadow_isTransparent() {
        val s = HomeservicesElevationShadowsLight.elev0
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(0f)
        assertThat(s.blur.value).isEqualTo(0f)
        assertThat(s.color).isEqualTo(Color.Transparent)
    }

    @Test
    internal fun lightElev1Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsLight.elev1
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(1f)
        assertThat(s.blur.value).isEqualTo(2f)
        assertThat(s.color).isEqualTo(Color(0x14000000))
    }

    @Test
    internal fun lightElev2Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsLight.elev2
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(4f)
        assertThat(s.blur.value).isEqualTo(12f)
        assertThat(s.color).isEqualTo(Color(0x14000000))
    }

    @Test
    internal fun lightElev3Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsLight.elev3
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(8f)
        assertThat(s.blur.value).isEqualTo(24f)
        assertThat(s.color).isEqualTo(Color(0x1F000000))
    }

    @Test
    internal fun lightElev4Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsLight.elev4
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(16f)
        assertThat(s.blur.value).isEqualTo(48f)
        assertThat(s.color).isEqualTo(Color(0x29000000))
    }

    // ── Dark shadows ──────────────────────────────────────────────────────────

    @Test
    internal fun darkElev0Shadow_isTransparent() {
        val s = HomeservicesElevationShadowsDark.elev0
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(0f)
        assertThat(s.blur.value).isEqualTo(0f)
        assertThat(s.color).isEqualTo(Color.Transparent)
    }

    @Test
    internal fun darkElev1Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsDark.elev1
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(1f)
        assertThat(s.blur.value).isEqualTo(2f)
        assertThat(s.color).isEqualTo(Color(0x66000000))
    }

    @Test
    internal fun darkElev2Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsDark.elev2
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(4f)
        assertThat(s.blur.value).isEqualTo(12f)
        assertThat(s.color).isEqualTo(Color(0x80000000))
    }

    @Test
    internal fun darkElev3Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsDark.elev3
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(8f)
        assertThat(s.blur.value).isEqualTo(24f)
        assertThat(s.color).isEqualTo(Color(0x99000000))
    }

    @Test
    internal fun darkElev4Shadow_matchesUxSpec() {
        val s = HomeservicesElevationShadowsDark.elev4
        assertThat(s.offsetX.value).isEqualTo(0f)
        assertThat(s.offsetY.value).isEqualTo(16f)
        assertThat(s.blur.value).isEqualTo(48f)
        assertThat(s.color).isEqualTo(Color(0xB3000000))
    }

    // ── CompositionLocal default ──────────────────────────────────────────────

    @Test
    internal fun localHomeservicesElevation_isNotNull() {
        // .current requires @Composable context — full CompositionLocal resolution
        // is verified end-to-end in T6 Paparazzi tests. Here we assert the val exists.
        assertThat(LocalHomeservicesElevation).isNotNull()
    }
}

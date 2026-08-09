package com.homeservices.designsystem.motion

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

internal class ReducedMotionTest {
    @Test
    fun `zero animator scale means reduced motion`() {
        assertThat(isReducedMotion(0f)).isTrue()
    }

    @Test
    fun `normal animator scale means motion is allowed`() {
        assertThat(isReducedMotion(1f)).isFalse()
    }

    @Test
    fun `a slowed animator scale is still motion`() {
        assertThat(isReducedMotion(2f)).isFalse()
    }

    /** Settings.Global returns the default when unset; a negative value is malformed. Fail safe. */
    @Test
    fun `a malformed negative scale is treated as reduced`() {
        assertThat(isReducedMotion(-1f)).isTrue()
    }
}

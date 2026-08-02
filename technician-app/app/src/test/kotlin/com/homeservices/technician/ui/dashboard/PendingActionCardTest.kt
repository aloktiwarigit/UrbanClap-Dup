package com.homeservices.technician.ui.dashboard

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * [PendingActionCard]'s countdown read `System.currentTimeMillis()` once at composition, so a
 * card reading "28s" kept reading "28s" until something else recomposed the dashboard (S-33).
 * These tests cover [remainingSeconds], the pure function the composable now recomputes every
 * second via a ticking LaunchedEffect.
 */
public class PendingActionCardTest {
    @Test
    public fun `remaining seconds counts down from a future expiry`(): Unit {
        val now = 1_000_000L
        assertThat(remainingSeconds(expiresAtMs = now + 28_000L, nowMs = now)).isEqualTo(28L)
    }

    @Test
    public fun `remaining seconds is zero at the exact expiry instant`(): Unit {
        val now = 1_000_000L
        assertThat(remainingSeconds(expiresAtMs = now, nowMs = now)).isEqualTo(0L)
    }

    @Test
    public fun `remaining seconds never goes negative once expiry has passed`(): Unit {
        val now = 1_000_000L
        assertThat(remainingSeconds(expiresAtMs = now - 5_000L, nowMs = now)).isEqualTo(0L)
    }

    @Test
    public fun `remaining seconds truncates a partial second down`(): Unit {
        val now = 1_000_000L
        assertThat(remainingSeconds(expiresAtMs = now + 1_999L, nowMs = now)).isEqualTo(1L)
    }
}

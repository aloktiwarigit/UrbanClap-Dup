package com.homeservices.technician.ui.dashboard

internal const val MS_PER_SECOND: Long = 1_000L

internal fun remainingSeconds(
    expiresAtMs: Long,
    nowMs: Long,
): Long = ((expiresAtMs - nowMs) / MS_PER_SECOND).coerceAtLeast(0)

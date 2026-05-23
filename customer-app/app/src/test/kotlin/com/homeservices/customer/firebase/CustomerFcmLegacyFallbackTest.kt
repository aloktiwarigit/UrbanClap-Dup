package com.homeservices.customer.firebase

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/**
 * JVM unit tests for [shouldPostLegacyEvent].
 *
 * Validates the FIX 1 logic: legacy event-bus posts continue for
 * ADDON_APPROVAL_REQUESTED and RATING_PROMPT_CUSTOMER when the new
 * router/ingestor path cannot build a PendingAction (userId missing from
 * backend FCM payload).
 *
 * No Hilt / Android runtime required — pure function tests.
 */
public class CustomerFcmLegacyFallbackTest {
    // ── ADDON_APPROVAL_REQUESTED ──────────────────────────────────────────────

    @Test
    public fun `legacy event-bus posts continue for ADDON_APPROVAL_REQUESTED when userId missing`() {
        // action not built (userId absent) → legacy fallback required
        val result =
            shouldPostLegacyEvent(
                fcmType = "ADDON_APPROVAL_REQUESTED",
                actionBuiltSuccessfully = false,
            )
        assertThat(result).isTrue
    }

    @Test
    public fun `legacy event-bus suppressed for ADDON_APPROVAL_REQUESTED when action built successfully`() {
        // action built (userId present) → new path succeeded; legacy suppressed by
        // shouldPostLegacyEvent but caller still posts legacy explicitly for foreground UI
        val result =
            shouldPostLegacyEvent(
                fcmType = "ADDON_APPROVAL_REQUESTED",
                actionBuiltSuccessfully = true,
            )
        assertThat(result).isFalse
    }

    // ── RATING_PROMPT_CUSTOMER ────────────────────────────────────────────────

    @Test
    public fun `legacy event-bus posts continue for RATING_PROMPT_CUSTOMER when userId missing`() {
        val result =
            shouldPostLegacyEvent(
                fcmType = "RATING_PROMPT_CUSTOMER",
                actionBuiltSuccessfully = false,
            )
        assertThat(result).isTrue
    }

    @Test
    public fun `legacy event-bus suppressed for RATING_PROMPT_CUSTOMER when action built successfully`() {
        val result =
            shouldPostLegacyEvent(
                fcmType = "RATING_PROMPT_CUSTOMER",
                actionBuiltSuccessfully = true,
            )
        assertThat(result).isFalse
    }

    // ── Non-legacy types ──────────────────────────────────────────────────────

    @Test
    public fun `COMPLAINT_UPDATE never triggers legacy event-bus regardless of action build result`() {
        assertThat(shouldPostLegacyEvent("COMPLAINT_UPDATE", false)).isFalse
        assertThat(shouldPostLegacyEvent("COMPLAINT_UPDATE", true)).isFalse
    }

    @Test
    public fun `SUPPORT_FOLLOWUP never triggers legacy event-bus`() {
        assertThat(shouldPostLegacyEvent("SUPPORT_FOLLOWUP", false)).isFalse
    }

    @Test
    public fun `null fcmType never triggers legacy event-bus`() {
        assertThat(shouldPostLegacyEvent(null, false)).isFalse
    }

    @Test
    public fun `unknown type never triggers legacy event-bus`() {
        assertThat(shouldPostLegacyEvent("LOCATION_UPDATE", false)).isFalse
    }
}

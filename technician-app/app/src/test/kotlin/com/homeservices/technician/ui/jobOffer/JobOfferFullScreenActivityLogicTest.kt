package com.homeservices.technician.ui.jobOffer

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * SAFE-JOB-001 / SAFE-JOB-003 — decision logic for the lock-screen job-offer Activity.
 *
 * `JobOfferFullScreenActivity` previously called `setContent` once in `onCreate` and never observed
 * the ViewModel, so it reacted to none of the terminal states: after Accept, Decline or Expiry the
 * technician was left on a static full-screen message over the lock screen with no button and no
 * navigation. Following the codebase convention (see `MainActivityNavTest` / `navigateFromExtra`),
 * the decision is extracted as a pure function and tested here rather than instrumenting the
 * Activity.
 */
public class JobOfferFullScreenActivityLogicTest {
    @Test
    public fun `accepting an offer finishes the activity`() {
        assertThat(shouldFinishForState(JobOfferUiState.Accepted("bk-1"))).isTrue()
    }

    @Test
    public fun `declining an offer finishes the activity`() {
        assertThat(shouldFinishForState(JobOfferUiState.Declined)).isTrue()
    }

    @Test
    public fun `an expired offer finishes the activity`() {
        assertThat(shouldFinishForState(JobOfferUiState.Expired)).isTrue()
    }

    @Test
    public fun `an offer still being decided keeps the activity open`() {
        val offering =
            JobOfferUiState.Offering(
                offer = sampleOffer(),
                remainingSeconds = 12,
            )
        assertThat(shouldFinishForState(offering)).isFalse()
    }

    @Test
    public fun `an offer mid-accept keeps the activity open until it resolves`() {
        val accepting =
            JobOfferUiState.Offering(
                offer = sampleOffer(),
                remainingSeconds = 3,
                isAccepting = true,
            )
        assertThat(shouldFinishForState(accepting)).isFalse()
    }

    @Test
    public fun `idle does not finish - the offer may still be arriving over the event bus`() {
        assertThat(shouldFinishForState(JobOfferUiState.Idle)).isFalse()
    }

    /**
     * SAFE-JOB-002 — a malformed FCM payload must fail closed.
     *
     * `offerFromIntent` returns null when any extra is missing, but `emitIntentOffer` no-opped and
     * `setContent` ran regardless, leaving `Idle` rendered as a dead full-screen page over the lock
     * screen. The Activity must decide not to render at all.
     */
    @Test
    public fun `a malformed payload must not render`() {
        assertThat(shouldRenderOffer(null)).isFalse()
    }

    @Test
    public fun `a well-formed payload renders`() {
        assertThat(shouldRenderOffer(sampleOffer())).isTrue()
    }

    private fun sampleOffer() =
        com.homeservices.technician.domain.jobOffer.model.JobOffer(
            bookingId = "bk-1",
            serviceId = "svc-1",
            serviceName = "AC service",
            addressText = "Ayodhya",
            slotDate = "2026-07-27",
            slotWindow = "08:00-10:00",
            amountPaise = 45_000L,
            distanceKm = 4.3,
            expiresAtMs = 1_785_000_000_000L,
            serverClockOffsetMs = 0L,
        )
}

package com.homeservices.customer.navigation

import com.homeservices.corenav.PendingActionType
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

/**
 * TDD-first: verify navigation routing logic for Room-sourced pending actions.
 *
 * E11-S01b-2 Part C: AppNavigation no longer takes PriceApprovalEventBus or
 * RatingPromptEventBus as parameters. Navigation is driven by Room-observed
 * PendingAction rows instead. These tests cover the helper that maps
 * PendingActionType to a Compose Nav route.
 *
 * Manual construction — no Hilt, no Android runtime.
 * Per docs/patterns/hilt-module-android-test-scope.md.
 */
public class PendingActionNavObserverTest {

    @Test
    public fun `ADDON_APPROVAL_REQUESTED maps to price-approval route for bookingId`() {
        val bookingId = "bk-test-1"
        val route = pendingActionNavRoute(PendingActionType.ADDON_APPROVAL_REQUESTED, bookingId)
        assertThat(route).isEqualTo(BookingRoutes.priceApprovalRoute(bookingId))
    }

    @Test
    public fun `RATING_PROMPT_CUSTOMER maps to rating route for bookingId`() {
        val bookingId = "bk-test-2"
        val route = pendingActionNavRoute(PendingActionType.RATING_PROMPT_CUSTOMER, bookingId)
        assertThat(route).isEqualTo(com.homeservices.customer.ui.rating.RatingRoutes.route(bookingId))
    }

    @Test
    public fun `COMPLAINT_UPDATE returns null (no direct nav from AppNavigation)`() {
        val route = pendingActionNavRoute(PendingActionType.COMPLAINT_UPDATE, "cmp-1")
        assertThat(route).isNull()
    }

    @Test
    public fun `SUPPORT_FOLLOWUP returns null`() {
        val route = pendingActionNavRoute(PendingActionType.SUPPORT_FOLLOWUP, "t-1")
        assertThat(route).isNull()
    }
}

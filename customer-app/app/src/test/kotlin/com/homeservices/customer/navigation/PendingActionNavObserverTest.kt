package com.homeservices.customer.navigation

import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.ui.rating.RatingRoutes
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
 * Also covers P2 fix (Codex review): single highest-priority action selection
 * — when multiple ACTIVE actions are present, only the first mappable action
 * (as returned by [pendingActionNavRoute]) triggers navigation.
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
        assertThat(route).isEqualTo(RatingRoutes.route(bookingId))
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

    // ── P2 fix: single-action selection ──────────────────────────────────────

    /**
     * Verifies the P2 fix selection logic: given multiple ACTIVE actions, only the
     * first one with a mappable route should be selected for navigation.
     *
     * We simulate the filter+firstOrNull logic from PendingActionsNavEffect to confirm
     * it picks the correct (first) action and ignores the rest in a single emission.
     */
    @Test
    public fun `when multiple active actions present only the first mappable one is selected`() {
        val navigatedIds = mutableSetOf<String>()
        val actions =
            listOf(
                stubAction(id = "a1", type = PendingActionType.ADDON_APPROVAL_REQUESTED, entityId = "bk-001"),
                stubAction(id = "a2", type = PendingActionType.RATING_PROMPT_CUSTOMER, entityId = "bk-002"),
            )

        val topAction =
            actions
                .filter { it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
                .firstOrNull { pendingActionNavRoute(it.type, it.entityId) != null }

        assertThat(topAction).isNotNull
        assertThat(topAction!!.id).isEqualTo("a1")
        // Only one navigate call should follow — verified by the fact that topAction is a single item.
        val selectedRoute = pendingActionNavRoute(topAction.type, topAction.entityId)
        assertThat(selectedRoute).isEqualTo(BookingRoutes.priceApprovalRoute("bk-001"))
    }

    @Test
    public fun `already-navigated action ids are skipped in subsequent emissions`() {
        val navigatedIds = mutableSetOf("a1")
        val actions =
            listOf(
                stubAction(id = "a1", type = PendingActionType.ADDON_APPROVAL_REQUESTED, entityId = "bk-001"),
                stubAction(id = "a2", type = PendingActionType.RATING_PROMPT_CUSTOMER, entityId = "bk-002"),
            )

        val topAction =
            actions
                .filter { it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
                .firstOrNull { pendingActionNavRoute(it.type, it.entityId) != null }

        // a1 already navigated — expect a2 to be selected
        assertThat(topAction).isNotNull
        assertThat(topAction!!.id).isEqualTo("a2")
    }

    @Test
    public fun `non-navigable actions alone return null topAction`() {
        val navigatedIds = mutableSetOf<String>()
        val actions =
            listOf(
                stubAction(id = "c1", type = PendingActionType.COMPLAINT_UPDATE, entityId = "cmp-1"),
            )

        val topAction =
            actions
                .filter { it.status == PendingActionStatus.ACTIVE && it.id !in navigatedIds }
                .firstOrNull { pendingActionNavRoute(it.type, it.entityId) != null }

        assertThat(topAction).isNull()
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun stubAction(
        id: String,
        type: PendingActionType,
        entityId: String,
    ) = com.homeservices.corenav.PendingAction(
        id = id,
        userId = "u-test",
        role = "customer",
        type = type,
        entityType = type.name.lowercase(),
        entityId = entityId,
        routeUri = "homeservices://action/${type.name}?entityId=$entityId",
        priority = PendingActionPriority.NORMAL,
        status = PendingActionStatus.ACTIVE,
        sourceStatus = null,
        version = 1L,
        createdAt = 0L,
        updatedAt = 0L,
        expiresAt = null,
        resolvedAt = null,
    )
}

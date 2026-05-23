package com.homeservices.customer.navigation

import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.ui.rating.RatingRoutes

/**
 * Maps a [PendingActionType] and its entity ID to a Compose Nav route string,
 * or null if AppNavigation does not handle direct navigation for that type.
 *
 * E11-S01b-2: Used by [PendingActionsNavEffect] inside AppNavigation to drive
 * navigation from Room-observed [PendingAction] rows, replacing the legacy
 * [PriceApprovalEventBus] and [RatingPromptEventBus] approach.
 *
 * @param type  The pending action type from the FCM/Room row.
 * @param entityId  The booking or complaint ID associated with the action.
 * @return The Compose Nav route string to navigate to, or null to suppress navigation.
 */
public fun pendingActionNavRoute(
    type: PendingActionType,
    entityId: String,
): String? =
    when (type) {
        PendingActionType.ADDON_APPROVAL_REQUESTED -> BookingRoutes.priceApprovalRoute(entityId)
        PendingActionType.RATING_PROMPT_CUSTOMER -> RatingRoutes.route(entityId)
        else -> null
    }

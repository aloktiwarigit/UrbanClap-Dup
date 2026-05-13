package com.homeservices.customer.navigation

import com.homeservices.corenav.CommonRouteSpec
import com.homeservices.corenav.NotificationIntent
import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionType
import com.homeservices.corenav.RouteContext
import com.homeservices.corenav.RouteResolver
import com.homeservices.corenav.RouteSpec
import com.homeservices.corenav.TierLadder
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Customer-app implementation of [RouteResolver].
 *
 * Maps [CommonRouteSpec] values returned by [TierLadder.resolve] to the
 * customer-app's concrete route strings (compatible with Compose Nav string routes).
 *
 * Used by [com.homeservices.customer.MainActivity] to determine the initial route
 * on cold start per the E11 spec §4.1 tier-ladder flow.
 *
 * Per E11-S01b-2: typed route migration is deferred. This resolver maps to
 * existing string route constants until the migration codemod runs.
 */
@Singleton
public class CustomerRouteResolver
    @Inject
    constructor() : RouteResolver {
        /**
         * Resolve the initial cold-start route using [TierLadder].
         *
         * @param ctx Fully-populated [RouteContext] assembled by MainActivity
         *            before calling this method.
         * @return A [RouteSpec] whose [RouteSpec.name] maps to a valid Compose Nav route string.
         */
        override suspend fun decideInitialRoute(ctx: RouteContext): RouteSpec {
            val commonSpec = TierLadder.resolve(ctx)
            return mapToCustomerRoute(commonSpec)
        }

        /** Map a [PendingAction] to its customer-side route specifier. */
        override fun routeFor(action: PendingAction): RouteSpec =
            when (action.type) {
                PendingActionType.ADDON_APPROVAL_REQUESTED ->
                    CustomerRouteSpec.BookingPriceApproval
                PendingActionType.RATING_PROMPT_CUSTOMER ->
                    CustomerRouteSpec.Rating
                PendingActionType.COMPLAINT_UPDATE ->
                    CustomerRouteSpec.Complaint
                PendingActionType.SUPPORT_FOLLOWUP ->
                    CustomerRouteSpec.Settings
                else ->
                    CustomerRouteSpec.Home
            }

        /** Map a [NotificationIntent] to a customer-side route specifier. */
        override fun routeFor(intent: NotificationIntent): RouteSpec =
            when (intent.type) {
                PendingActionType.ADDON_APPROVAL_REQUESTED ->
                    CustomerRouteSpec.BookingPriceApproval
                PendingActionType.RATING_PROMPT_CUSTOMER ->
                    CustomerRouteSpec.Rating
                PendingActionType.COMPLAINT_UPDATE ->
                    CustomerRouteSpec.Complaint
                else ->
                    CustomerRouteSpec.Home
            }

        // ── Private ───────────────────────────────────────────────────────────

        private fun mapToCustomerRoute(common: CommonRouteSpec): RouteSpec =
            when (common) {
                is CommonRouteSpec.Auth -> CustomerRouteSpec.Auth
                is CommonRouteSpec.KycBlocked -> CustomerRouteSpec.Home // customers don't have KYC blocking
                is CommonRouteSpec.CustomerHome -> CustomerRouteSpec.Home
                is CommonRouteSpec.CustomerPriceApproval -> CustomerRouteSpec.BookingPriceApproval
                is CommonRouteSpec.TechnicianDashboard -> CustomerRouteSpec.Home // should not occur
                is CommonRouteSpec.TechnicianActiveJob -> CustomerRouteSpec.Home // should not occur
                is CommonRouteSpec.TechnicianJobOffer -> CustomerRouteSpec.Home // should not occur
            }
    }

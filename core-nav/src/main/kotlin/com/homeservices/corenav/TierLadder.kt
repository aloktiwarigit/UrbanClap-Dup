package com.homeservices.corenav

/**
 * Pure tier-ladder resolver — no Android dependencies, fully unit-testable.
 *
 * Implements the 6-tier initial-route priority ladder defined in E11 spec §2.6:
 *
 *   T0 GATE        unauthenticated → AuthRoute
 *   T1 BLOCKING    tech KYC ∈ {NOT_STARTED, INCOMPLETE} → KycRoute
 *   T2 LIVE_OPS    tech active job ∈ {ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS} → ActiveJobRoute
 *                  customer booking AWAITING_PRICE_APPROVAL → PriceApprovalRoute
 *   T3 HIGH_ACTION JOB_OFFER (unexpired), SAFETY_SOS_FOLLOWUP (future)
 *   T4 NORMAL_ACTION KYC_RESUME, COMPLAINT_UPDATE, SUPPORT_FOLLOWUP
 *   T5 LOW_ACTION  RATING_PROMPT_*, RATING_RECEIVED, EARNINGS_UPDATE
 *   T6 DEFAULT     role-specific home/dashboard
 *
 * Tie-break within tier:
 *   1. Earliest non-null expiresAt (nulls lose to non-null)
 *   2. Oldest createdAt (ascending)
 *   3. Lexicographic id
 *
 * IMMUTABLE: Do not modify tier assignments without updating the spec.
 * Karnataka dispatch isolation invariant (ADR-0006/0011) is not affected by this module.
 */
public object TierLadder {
    private val T2_TECH_STATUSES = setOf("ASSIGNED", "EN_ROUTE", "REACHED", "IN_PROGRESS")
    private const val T2_CUSTOMER_PRICE_APPROVAL = "AWAITING_PRICE_APPROVAL"
    private val T1_BLOCKING_KYC = setOf("NOT_STARTED", "INCOMPLETE")

    // Named tier constants — avoids MagicNumber detekt violation in tierOf()
    private const val HIGH_TIER = 3
    private const val NORMAL_TIER = 2
    private const val LOW_TIER = 1

    /**
     * Resolve the initial route for the given [RouteContext].
     *
     * Returns a [CommonRouteSpec] value. Per-app [RouteResolver] implementations
     * map these to concrete Compose navigation routes.
     */
    @Suppress("ReturnCount") // guard-clause pattern: each early return is a distinct priority tier
    public fun resolve(ctx: RouteContext): CommonRouteSpec {
        // T0: Authentication gate — overrides everything
        if (ctx.authState !is AuthState.Authenticated) {
            return CommonRouteSpec.Auth
        }

        // T1: KYC blocking (technician only)
        if (ctx.role == "technician" && ctx.techKycStatus in T1_BLOCKING_KYC) {
            return CommonRouteSpec.KycBlocked
        }

        // T2: Live ops — contractual obligations
        if (ctx.role == "technician") {
            val activeJob = ctx.techActiveJob
            if (activeJob != null && activeJob.status in T2_TECH_STATUSES) {
                return CommonRouteSpec.TechnicianActiveJob(activeJob.bookingId)
            }
        }
        if (ctx.role == "customer") {
            val priceApproval =
                ctx.customerActiveBookings.firstOrNull {
                    it.status == T2_CUSTOMER_PRICE_APPROVAL
                }
            if (priceApproval != null) {
                return CommonRouteSpec.CustomerPriceApproval(priceApproval.bookingId)
            }
        }

        // T3–T5: Pending action tier routing
        val activeActions = ctx.activeActions.filter { it.status == PendingActionStatus.ACTIVE }

        val highestAction =
            activeActions
                .maxWithOrNull(actionTierComparator())

        if (highestAction != null) {
            return routeForAction(highestAction, ctx.role)
        }

        // T6: Default — role-specific home
        return when (ctx.role) {
            "technician" -> CommonRouteSpec.TechnicianDashboard
            else -> CommonRouteSpec.CustomerHome
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Comparator that sorts pending actions by:
     *   1. Priority tier (HIGH > NORMAL > LOW)
     *   2. Earliest expiresAt (nulls last)
     *   3. Oldest createdAt
     *   4. Lexicographic id
     *
     * Returns the comparator in descending order so `maxWithOrNull` picks the winner.
     */
    @Suppress("ReturnCount") // guard-clause pattern: each early return is an independent sort dimension
    private fun actionTierComparator(): Comparator<PendingAction> =
        Comparator { a, b ->
            // 1. Priority (HIGH wins)
            val tierCompare = tierOf(a).compareTo(tierOf(b))
            if (tierCompare != 0) return@Comparator tierCompare

            // 2. Earliest expiresAt (null = never expires = last)
            val expiryCompare = compareExpiry(a.expiresAt, b.expiresAt)
            if (expiryCompare != 0) return@Comparator expiryCompare

            // 3. Oldest createdAt (ascending = earlier is "more urgent")
            val createdCompare = b.createdAt.compareTo(a.createdAt)
            if (createdCompare != 0) return@Comparator createdCompare

            // 4. Lexicographic id (earlier alphabetically wins)
            b.id.compareTo(a.id)
        }

    /** Higher return value = higher priority. */
    private fun tierOf(action: PendingAction): Int =
        when (action.priority) {
            PendingActionPriority.HIGH -> HIGH_TIER
            PendingActionPriority.NORMAL -> NORMAL_TIER
            PendingActionPriority.LOW -> LOW_TIER
        }

    /**
     * Compare two nullable expiry timestamps.
     * Returns positive if [a] should win (expires sooner), negative if [b] should win.
     * Non-null expires sooner than null (null = no expiry = less urgent).
     */
    private fun compareExpiry(
        a: Long?,
        b: Long?,
    ): Int =
        when {
            a == null && b == null -> 0
            a == null -> -1 // b expires sooner → b wins; a loses
            b == null -> 1 // a expires sooner → a wins
            else -> b.compareTo(a) // smaller expiresAt = expires sooner = wins
        }

    /**
     * Map the highest-priority [PendingAction] to the appropriate [CommonRouteSpec].
     * For HIGH-priority JOB_OFFER → TechnicianJobOffer; everything else falls through
     * to the default dashboard for the role.
     */
    private fun routeForAction(
        action: PendingAction,
        role: String,
    ): CommonRouteSpec =
        when {
            action.priority == PendingActionPriority.HIGH &&
                action.type == PendingActionType.JOB_OFFER ->
                CommonRouteSpec.TechnicianJobOffer(action.entityId)

            role == "technician" -> CommonRouteSpec.TechnicianDashboard
            else -> CommonRouteSpec.CustomerHome
        }
}

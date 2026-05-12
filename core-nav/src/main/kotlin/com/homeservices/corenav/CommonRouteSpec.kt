package com.homeservices.corenav

/**
 * Common route spec values used by [TierLadder] for cross-app routing decisions.
 *
 * Per-app route hierarchies (CustomerRouteSpec, TechnicianRouteSpec) extend this
 * with app-specific routes. TierLadder returns [CommonRouteSpec] values; per-app
 * [RouteResolver] implementations map them to concrete Compose navigation routes.
 */
public sealed class CommonRouteSpec : RouteSpec {
    // ── Auth / gate routes ────────────────────────────────────────────────────

    /** T0: user is unauthenticated → authentication screen. */
    public object Auth : CommonRouteSpec() {
        override val name: String get() = "Auth"
    }

    /** T1: technician KYC is NOT_STARTED or INCOMPLETE → KYC blocking route. */
    public object KycBlocked : CommonRouteSpec() {
        override val name: String get() = "KycBlocked"
    }

    // ── Technician routes ─────────────────────────────────────────────────────

    /** T2: technician has an active job in one of the live-ops statuses. */
    public data class TechnicianActiveJob(
        public val bookingId: String,
    ) : CommonRouteSpec() {
        override val name: String get() = "TechnicianActiveJob"
    }

    /** T3/T4/T5/T6: technician dashboard — default for authenticated technician. */
    public object TechnicianDashboard : CommonRouteSpec() {
        override val name: String get() = "TechnicianDashboard"
    }

    /** T3: technician has an unresolved HIGH-priority JOB_OFFER. */
    public data class TechnicianJobOffer(
        public val offerId: String,
    ) : CommonRouteSpec() {
        override val name: String get() = "TechnicianJobOffer"
    }

    // ── Customer routes ───────────────────────────────────────────────────────

    /** T2: customer has a booking AWAITING_PRICE_APPROVAL. */
    public data class CustomerPriceApproval(
        public val bookingId: String,
    ) : CommonRouteSpec() {
        override val name: String get() = "CustomerPriceApproval"
    }

    /** T4/T5/T6: customer home — default for authenticated customer with no T2/T3 action. */
    public object CustomerHome : CommonRouteSpec() {
        override val name: String get() = "CustomerHome"
    }
}

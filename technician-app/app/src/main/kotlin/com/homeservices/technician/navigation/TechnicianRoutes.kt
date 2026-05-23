package com.homeservices.technician.navigation

import com.homeservices.corenav.RouteSpec
import kotlinx.serialization.Serializable

/**
 * Per-app typed route specifier enum — technician-app.
 */
public enum class TechnicianRouteSpec : RouteSpec {
    Auth,
    Onboarding,
    Kyc,
    Dashboard,
    JobOffer,
    ActiveJob,
    MyRatings,
    Earnings,
    Complaint,
    PayoutCadence,
    ServiceSelection,
    Profile,
    Settings,
}

/**
 * Typed Compose Nav 2.8 route sealed hierarchy — technician-app.
 *
 * Spike file for E11-S01a: validates that [@Serializable] routes work with
 * `composable<T>()` + `entry.toRoute<T>()` in the technician-app NavHost.
 */
public sealed interface TechnicianRoute {
    public val spec: TechnicianRouteSpec
}

/**
 * Simple no-arg route for the technician authentication screen.
 * Spike target: 1 simple route (no args) verified with typed nav.
 */
@Serializable
public data object TechnicianAuthRoute : TechnicianRoute {
    override val spec: TechnicianRouteSpec get() = TechnicianRouteSpec.Auth
}

/**
 * Argument-carrying route for the job offer screen.
 * Spike target: 1 arg-route verified with typed nav.
 *
 * Acceptance: `JobOfferRoute(offerId="offer-123")` round-trips through
 * `composable<JobOfferRoute>{}` + `entry.toRoute<JobOfferRoute>()`.
 */
@Serializable
public data class JobOfferRoute(
    public val offerId: String,
) : TechnicianRoute {
    override val spec: TechnicianRouteSpec get() = TechnicianRouteSpec.JobOffer
}

/**
 * Argument-carrying route for the active job screen.
 */
@Serializable
public data class ActiveJobRoute(
    public val bookingId: String,
) : TechnicianRoute {
    override val spec: TechnicianRouteSpec get() = TechnicianRouteSpec.ActiveJob
}

/**
 * Argument-carrying route for the complaint screen.
 */
@Serializable
public data class TechnicianComplaintRoute(
    public val bookingId: String,
    public val complaintId: String? = null,
) : TechnicianRoute {
    override val spec: TechnicianRouteSpec get() = TechnicianRouteSpec.Complaint
}

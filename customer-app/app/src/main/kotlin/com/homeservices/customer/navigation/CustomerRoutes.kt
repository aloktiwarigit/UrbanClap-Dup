package com.homeservices.customer.navigation

import com.homeservices.corenav.RouteSpec
import kotlinx.serialization.Serializable

/**
 * String route constants for the root nav-graph destinations.
 *
 * E11-S01b-2: Replace inline "auth" and "main" string literals throughout
 * AppNavigation.kt, AuthGraph.kt, and MainGraph.kt with these constants to
 * eliminate magic strings and make route renames compile-safe.
 *
 * Values are intentionally stable — they match the nav-graph `route` strings
 * registered in [NavGraphBuilder.authGraph] and [NavGraphBuilder.mainGraph].
 */
public const val ROUTE_AUTH: String = "auth"
public const val ROUTE_MAIN: String = "main"

/**
 * Per-app typed route specifier enum — customer-app.
 *
 * Each variant corresponds to a unique top-level screen or navigation graph.
 * Used by [TierLadder] (via [RouteResolver]) to determine the initial route
 * on cold start. The string [name] is stable and used in logging + deep-link URIs.
 */
public enum class CustomerRouteSpec : RouteSpec {
    Auth,
    FirstLaunch,
    Home,
    ServiceDetail,
    ServiceTracking,
    BookingPriceApproval,
    BookingConfirmed,
    Rating,
    Complaint,
    Profile,
    Settings,
    Wallet,
    SosAudio,
    DataExport,
    DeleteAccount,
}

/**
 * Typed Compose Nav 2.8 route sealed hierarchy for customer-app.
 *
 * Routes annotated with [@Serializable] can be used with:
 *   - `NavHost { composable<T>(content = { ... }) }`
 *   - `navController.navigate(route)`
 *   - `backStackEntry.toRoute<T>()`
 *
 * This is the SPIKE file for E11-S01a. The go/no-go gate verifies that
 * [BookingPriceApprovalRoute] round-trips through the typed nav API.
 *
 * **Do NOT migrate existing string-based routes to typed routes in this file.**
 * That migration is scoped to E11-S01b-2. The spike only validates feasibility.
 */
public sealed interface CustomerRoute {
    /** The [CustomerRouteSpec] that identifies this route for TierLadder resolution. */
    public val spec: CustomerRouteSpec
}

/**
 * Simple route with no arguments — corresponds to the existing "auth" string route.
 *
 * Spike target: 1 simple route (no args) verified with typed nav.
 */
@Serializable
public data object AuthRoute : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.Auth
}

/**
 * Argument-carrying route for booking price approval.
 * Verifies that arg-passing works through typed Compose Nav.
 *
 * Spike acceptance criterion: `BookingPriceApprovalRoute(bookingId="bk123")`
 * round-trips through `composable<BookingPriceApprovalRoute>{}` +
 * `entry.toRoute<BookingPriceApprovalRoute>()`.
 */
@Serializable
public data class BookingPriceApprovalRoute(
    public val bookingId: String,
) : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.BookingPriceApproval
}

/**
 * Argument-carrying route for live tracking screen.
 */
@Serializable
public data class ServiceTrackingRoute(
    public val bookingId: String,
) : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.ServiceTracking
}

/**
 * Argument-carrying route for the booking-confirmed screen.
 */
@Serializable
public data class BookingConfirmedRoute(
    public val bookingId: String,
) : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.BookingConfirmed
}

/**
 * Argument-carrying route for the rating submission screen.
 */
@Serializable
public data class RatingRoute(
    public val bookingId: String,
) : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.Rating
}

/**
 * Argument-carrying route for the complaint screen.
 */
@Serializable
public data class ComplaintRoute(
    public val bookingId: String,
    public val complaintId: String? = null,
) : CustomerRoute {
    override val spec: CustomerRouteSpec get() = CustomerRouteSpec.Complaint
}

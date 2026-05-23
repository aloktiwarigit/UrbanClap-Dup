package com.homeservices.corenav

/**
 * Interface for resolving navigation routes from pending actions or notification intents.
 *
 * Per-app implementations map [CommonRouteSpec] values to concrete Compose navigation routes.
 * The [decideInitialRoute] method is the cold-start entry point (E11 spec §4.1, step 5).
 */
public interface RouteResolver {
    /**
     * Decide the initial route on cold start based on the given [RouteContext].
     * Internally delegates to [TierLadder.resolve] and then maps the result to
     * the per-app concrete route type.
     */
    public suspend fun decideInitialRoute(ctx: RouteContext): RouteSpec

    /** Map a [PendingAction] to the route that will render its source entity. */
    public fun routeFor(action: PendingAction): RouteSpec

    /** Map a [NotificationIntent] to the route that will handle it. */
    public fun routeFor(intent: NotificationIntent): RouteSpec
}

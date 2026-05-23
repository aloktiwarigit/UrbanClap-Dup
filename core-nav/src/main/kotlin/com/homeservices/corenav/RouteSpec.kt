package com.homeservices.corenav

/**
 * Marker interface for route specifiers. Each per-app enum (e.g. `CustomerRouteSpec`,
 * `TechnicianRouteSpec`) implements this interface so [TierLadder] and [RouteResolver]
 * can operate over a common type.
 *
 * The [name] property mirrors `Enum.name` — e.g. "Auth", "CustomerHome" — and is used
 * for logging and deep-link type mapping.
 */
public interface RouteSpec {
    public val name: String
}

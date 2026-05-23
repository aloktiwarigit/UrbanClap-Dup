package com.homeservices.corenav

/**
 * Input context passed to [TierLadder.resolve] and [RouteResolver.decideInitialRoute].
 *
 * All fields are populated before the ladder runs. Source data probes (KYC status,
 * active job, active bookings) are fetched in parallel on cold start before calling resolve.
 * See E11 spec §4.1 (cold-start flow).
 */
public data class RouteContext(
    val authState: AuthState,
    /** "customer" or "technician". Must match [AuthState.Authenticated.role] when authenticated. */
    val role: String,
    /**
     * Local Room snapshot of ACTIVE pending actions for this user.
     * TierLadder only considers ACTIVE rows; RESOLVED and EXPIRED are ignored.
     */
    val activeActions: List<PendingAction>,
    /**
     * Current KYC status for technicians. Null for customer sessions.
     * Blocking values: "NOT_STARTED", "INCOMPLETE".
     * Non-blocking (card shown on dashboard): "SUBMITTED", "MANUAL_REVIEW", "COMPLETE".
     */
    val techKycStatus: String?,
    /**
     * Technician's current active job if one exists in a live-ops state.
     * Null if no active job. Status must be one of: ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS.
     * Only set for technician sessions.
     */
    val techActiveJob: ActiveJobSummary?,
    /**
     * Customer's active bookings. TierLadder only checks for AWAITING_PRICE_APPROVAL status
     * as T2. Other active statuses (e.g. ASSIGNED tracking) surface as home cards — not T2.
     * Empty for technician sessions.
     */
    val customerActiveBookings: List<BookingSummary>,
)

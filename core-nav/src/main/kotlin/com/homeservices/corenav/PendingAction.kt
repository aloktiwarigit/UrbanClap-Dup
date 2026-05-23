package com.homeservices.corenav

/**
 * Domain model for a pending action.
 *
 * This is the shared cross-app representation. It is mapped to/from:
 *   - [PendingActionEntity] (Room, per-app persistence layer)
 *   - API response DTO (via the per-app repository)
 *
 * The [id] is deterministic: `<TYPE>:<role>:<userId>:<entityType>:<entityId>`.
 * This ensures idempotent upserts and enables the version-aware stale-drop check
 * in PendingActionIngestor (E11-S01b-1).
 *
 * [version] is a monotonic integer bumped by the server projector on every mutation.
 * The ingestor drops incoming FCM if `incoming.version <= existing.version`.
 */
public data class PendingAction(
    /** Deterministic compound id: `<TYPE>:<role>:<userId>:<entityType>:<entityId>`. */
    val id: String,
    val userId: String,
    /** "customer" or "technician". */
    val role: String,
    val type: PendingActionType,
    /** e.g. "booking", "job_offer", "complaint". */
    val entityType: String,
    /** Opaque ID of the source entity (bookingId, offerId, complaintId, etc.). */
    val entityId: String,
    /** Deep-link URI: `homeservices://action/<TYPE>?<args>`. Built by [DeepLinkUri]. */
    val routeUri: String,
    val priority: PendingActionPriority,
    val status: PendingActionStatus,
    /** Snapshot of the source entity's status at the time of last projection. */
    val sourceStatus: String?,
    /** Monotonic version counter; used for stale-drop detection in Ingestor. */
    val version: Long,
    val createdAt: Long,
    val updatedAt: Long,
    /** Epoch ms after which the action expires. Null = no expiry (e.g., COMPLAINT_UPDATE). */
    val expiresAt: Long?,
    /** Epoch ms at which this action was resolved; null if still active. */
    val resolvedAt: Long?,
)

/**
 * Parsed FCM notification intent — the intermediate form between raw FCM data
 * and a fully-hydrated [PendingAction].
 */
public data class NotificationIntent(
    val type: PendingActionType,
    /** The primary entity identifier carried in the FCM data payload. */
    val entityId: String,
    /** All key-value pairs from the FCM data payload or deep-link query args. */
    val rawArgs: Map<String, String>,
)

/**
 * Minimal summary of a technician's active job, used by [TierLadder] to decide T2 routing.
 * Full details are fetched by the per-app screen on entry.
 */
public data class ActiveJobSummary(
    val bookingId: String,
    /** One of: ASSIGNED, EN_ROUTE, REACHED, IN_PROGRESS. */
    val status: String,
)

/**
 * Minimal summary of a customer's active booking, used by [TierLadder] to decide T2 routing.
 */
public data class BookingSummary(
    val bookingId: String,
    /** One of: AWAITING_PRICE_APPROVAL, ASSIGNED, SEARCHING, etc. */
    val status: String,
)

package com.homeservices.customer.data.pendingaction.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Room entity for the `pending_actions` table — customer-app.
 *
 * Schema mirrors the E11 spec §3.4 design. Indexes exist on the fields used by
 * [PendingActionDao]'s query methods.
 *
 * [version] is a monotonic integer bumped by the server projector. The ingestor
 * (E11-S01b-1) uses it for stale-drop detection.
 *
 * [lastFetchedAt] tracks when this row was last hydrated from the network, allowing
 * UI to show "stale data" warnings.
 *
 * Room schema version 1 — no migration required for fresh install.
 */
@Entity(
    tableName = "pending_actions",
    indices = [
        Index("status"),
        Index("type"),
        Index("expiresAt"),
        Index("priority"),
        Index("createdAt"),
    ],
)
public data class PendingActionEntity(
    @PrimaryKey public val id: String,
    public val userId: String,
    /** "customer" or "technician". */
    public val role: String,
    /** String representation of [com.homeservices.corenav.PendingActionType]. */
    public val type: String,
    public val entityType: String,
    public val entityId: String,
    /** `homeservices://action/<TYPE>?<args>` URI built by DeepLinkUri in core-nav. */
    public val routeUri: String,
    /** String representation of [com.homeservices.corenav.PendingActionPriority]. */
    public val priority: String,
    /** String representation of [com.homeservices.corenav.PendingActionStatus]. */
    public val status: String,
    public val sourceStatus: String?,
    /** Monotonic version counter; incremented by server projector on every mutation. */
    public val version: Long,
    public val createdAt: Long,
    public val updatedAt: Long,
    /** Expiry epoch ms; null = no TTL. ACTIVE rows past this are purged by [PendingActionDao.purgeExpired]. */
    public val expiresAt: Long?,
    /** Set when status transitions to RESOLVED. Tombstones older than 30d are purged by [PendingActionDao.purgeTombstones]. */
    public val resolvedAt: Long?,
    /** When this row was last fetched from the server. Used to detect stale local state. */
    public val lastFetchedAt: Long,
)

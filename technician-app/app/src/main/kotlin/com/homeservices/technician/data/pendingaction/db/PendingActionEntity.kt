package com.homeservices.technician.data.pendingaction.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Room entity for the `pending_actions` table — technician-app.
 *
 * Mirrors the customer-app schema exactly. Both apps share the same E11 spec §3.4 design.
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
    public val role: String,
    public val type: String,
    public val entityType: String,
    public val entityId: String,
    public val routeUri: String,
    public val priority: String,
    public val status: String,
    public val sourceStatus: String?,
    public val version: Long,
    public val createdAt: Long,
    public val updatedAt: Long,
    public val expiresAt: Long?,
    public val resolvedAt: Long?,
    public val lastFetchedAt: Long,
)

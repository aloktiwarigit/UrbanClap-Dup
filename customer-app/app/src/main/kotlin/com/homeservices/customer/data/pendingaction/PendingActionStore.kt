package com.homeservices.customer.data.pendingaction

import com.homeservices.corenav.PendingAction
import com.homeservices.corenav.PendingActionPriority
import com.homeservices.corenav.PendingActionStatus
import com.homeservices.corenav.PendingActionType
import com.homeservices.customer.data.pendingaction.db.PendingActionDao
import com.homeservices.customer.data.pendingaction.db.PendingActionEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * Local persistence abstraction for pending actions — customer-app.
 *
 * Wraps [PendingActionDao] and performs domain↔entity mapping. Business logic in
 * `PendingActionIngestor` (E11-S01b-1) calls this store for all persistence operations.
 *
 * This class has no network calls and no Android framework dependencies beyond Room.
 * All public methods are [suspend] to allow callers to run them on any dispatcher.
 *
 * Provided by [com.homeservices.customer.data.pendingaction.di.PendingActionsModule].
 * detekt: deliberate facade over store + DAO; splitting would invert call sites unnecessarily
 */
@Suppress("TooManyFunctions")
public class PendingActionStore(
    private val dao: PendingActionDao,
) {
    // ── Reads ─────────────────────────────────────────────────────────────────

    /** Observe ACTIVE pending actions for [userId] as a reactive Flow. */
    public fun observeActive(userId: String): Flow<List<PendingAction>> = dao
        .observeActive(userId)
        .map { entities ->
            entities.map { it.toDomain() }
        }

    /** Find a single pending action by its deterministic [id]. Returns null if absent. */
    public suspend fun findById(id: String): PendingAction? = dao.findById(id)?.toDomain()

    // ── Writes ────────────────────────────────────────────────────────────────

    /** Upsert (insert-or-replace) a list of pending actions. */
    public suspend fun upsertAll(actions: List<PendingAction>) {
        dao.upsertAll(actions.map { it.toEntity() })
    }

    /** Upsert a single pending action. */
    public suspend fun upsert(action: PendingAction) {
        upsertAll(listOf(action))
    }

    /**
     * Tombstone ACTIVE rows absent from [keepIds] for [userId].
     * Called during reconcile after the full server snapshot has been upserted.
     */
    public suspend fun markMissingAsResolved(
        userId: String,
        keepIds: Set<String>,
        now: Long,
    ) {
        dao.markMissingAsResolved(userId = userId, keep = keepIds, now = now)
    }

    /**
     * Mark a specific action as resolved (e.g. on FCM "action_resolved" receipt).
     * Sets status = RESOLVED and resolvedAt = [now].
     */
    public suspend fun markResolved(
        id: String,
        now: Long,
    ) {
        dao.markResolved(id = id, now = now)
    }

    /**
     * Delete ACTIVE rows past their TTL. Tombstones are NOT affected — use [purgeTombstones].
     * Call during reconcile and on cold start.
     */
    public suspend fun purgeExpired(now: Long) {
        dao.purgeExpired(now)
    }

    /**
     * Delete RESOLVED tombstone rows older than [cutoff] (epoch ms).
     * Typically called with `cutoff = now - 30.days.inWholeMilliseconds`.
     */
    public suspend fun purgeTombstones(cutoff: Long) {
        dao.purgeTombstones(cutoff)
    }

    /**
     * Delete ALL rows for ALL users. Called on logout per E11 spec §4.7.
     * Fresh reconcile() on re-login restores the current server state.
     */
    public suspend fun clearAll() {
        dao.clearAll()
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private fun PendingActionEntity.toDomain(): PendingAction =
        PendingAction(
            id = id,
            userId = userId,
            role = role,
            type = PendingActionType.valueOf(type),
            entityType = entityType,
            entityId = entityId,
            routeUri = routeUri,
            priority = PendingActionPriority.valueOf(priority),
            status = PendingActionStatus.valueOf(status),
            sourceStatus = sourceStatus,
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = resolvedAt,
        )

    private fun PendingAction.toEntity(): PendingActionEntity =
        PendingActionEntity(
            id = id,
            userId = userId,
            role = role,
            type = type.name,
            entityType = entityType,
            entityId = entityId,
            routeUri = routeUri,
            priority = priority.name,
            status = status.name,
            sourceStatus = sourceStatus,
            version = version,
            createdAt = createdAt,
            updatedAt = updatedAt,
            expiresAt = expiresAt,
            resolvedAt = resolvedAt,
            lastFetchedAt = System.currentTimeMillis(),
        )
}
